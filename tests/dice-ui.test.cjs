const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
// Execute the real application handlers with a minimal DOM adapter, not a browser.
function app(){
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),nodes=new Map();
 function element(){return {textContent:'',innerHTML:'',hidden:false,disabled:false,children:[],handlers:{},attributes:{},append(n){this.children.push(n);},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.handlers[k]=f;},click(){if(!this.disabled)this.handlers.click?.();},focus(){}};}
 for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],element());
 const math=Object.create(Math);math.random=()=>.42;
 const ctx=vm.createContext({document:{getElementById:id=>nodes.get(id),createElement:element},Math:math});ctx.window=ctx;
 for(const file of ['engine.js','chart.js','mitigation.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../'+file),'utf8'),ctx);
 return {nodes,ctx,click:()=>nodes.get('advance').click(),setRandom:r=>{math.random=()=>r;}};
}
function fireSeason(a){a.click();a.click();a.click();assert.equal(a.nodes.get('advance').textContent,'Roll d100');}
test('real Roll d100 handler produces a result and continues to winter',()=>{const a=app();fireSeason(a);a.setRandom(.99);a.click();assert.match(a.nodes.get('fire-result').textContent,/Last roll: 100/);assert.equal(a.nodes.get('advance').textContent,'Next Season');a.click();assert.equal(a.nodes.get('season-heading').textContent,'Winter');});
test('visible no-fire result shows the roll, threshold and reason next to controls',()=>{const a=app();fireSeason(a);a.setRandom(.99);a.click();assert.equal(a.nodes.get('dice-result').hidden,false);assert.equal(a.nodes.get('dice-value').textContent,'100');assert.equal(a.nodes.get('dice-outcome').textContent,'NO WILDFIRE');assert.match(a.nodes.get('dice-explanation').textContent,/100.*12/);assert.match(a.nodes.get('dice-explanation').textContent,/unchanged/);});
test('visible wildfire result uses pre-fire threshold and explicit outcome',()=>{const a=app();fireSeason(a);a.setRandom(0);a.click();assert.equal(a.nodes.get('dice-value').textContent,'1');assert.equal(a.nodes.get('dice-outcome').textContent,'WILDFIRE');assert.match(a.nodes.get('dice-explanation').textContent,/1.*12/);assert.match(a.nodes.get('dice-explanation').textContent,/seeds/);});
test('equality means no fire and Reset removes previous result',()=>{const a=app();fireSeason(a);a.setRandom(.115);a.click();assert.equal(a.nodes.get('dice-value').textContent,'12');assert.equal(a.nodes.get('dice-outcome').textContent,'NO WILDFIRE');a.nodes.get('reset').click();assert.equal(a.nodes.get('dice-result').hidden,true);assert.equal(a.nodes.get('fire-result').textContent,'No roll yet.');});

test('mode switching preserves separate trials and Reset affects only active mode',()=>{
 const a=app();a.click();assert.equal(a.nodes.get('season-heading').textContent,'Summer');
 a.nodes.get('mode-native').click();assert.equal(a.nodes.get('season-heading').textContent,'Spring');assert.equal(a.nodes.get('mode-native').attributes['aria-pressed'],'true');
 assert.equal(vm.runInContext('E.counts(state).cheatPlants',a.ctx),0);
 fireSeason(a);a.setRandom(.99);a.click();a.click();a.click();assert.equal(vm.runInContext('state.history.length',a.ctx),1);
 a.nodes.get('mode-invaded').click();assert.equal(a.nodes.get('season-heading').textContent,'Summer');assert.equal(vm.runInContext('E.counts(state).dead',a.ctx),4);
 a.nodes.get('reset').click();assert.equal(a.nodes.get('season-heading').textContent,'Spring');
 a.nodes.get('mode-native').click();assert.equal(vm.runInContext('state.year',a.ctx),1);assert.equal(vm.runInContext('state.history.length',a.ctx),1);
 a.nodes.get('reset').click();assert.equal(vm.runInContext('state.history.length',a.ctx),0);assert.equal(vm.runInContext('E.counts(state).cheatPlants',a.ctx),0);
});

test('management UI previews, cancels and applies once without changing other modes',()=>{
 const a=app();a.nodes.get('mode-mitigation').click();assert.equal(a.nodes.get('tools-panel').hidden,false);
 const sage=vm.runInContext("state.board.indexOf('sage')",a.ctx),before=vm.runInContext('JSON.stringify(state.board)',a.ctx);
 a.nodes.get('tool-hoe').click();a.nodes.get('board').children[sage].click();assert.equal(a.nodes.get('tool-apply').disabled,false);assert.equal(vm.runInContext('JSON.stringify(state.board)',a.ctx),before);
 a.nodes.get('tool-cancel').click();assert.equal(a.nodes.get('tool-apply').disabled,true);assert.equal(vm.runInContext('JSON.stringify(state.board)',a.ctx),before);
 a.nodes.get('tool-hoe').click();a.nodes.get('board').children[sage].click();a.nodes.get('tool-apply').click();assert.equal(vm.runInContext('E.counts(state).sage',a.ctx),7);assert.equal(a.nodes.get('tool-seed').disabled,true);
 a.nodes.get('mode-invaded').click();assert.equal(a.nodes.get('tools-panel').hidden,true);assert.equal(vm.runInContext('E.counts(state).sage',a.ctx),8);
 a.nodes.get('mode-mitigation').click();assert.equal(vm.runInContext('E.counts(state).sage',a.ctx),7);assert.equal(a.nodes.get('tool-hoe').disabled,true);
 a.click();assert.equal(a.nodes.get('tool-seed').disabled,false);a.nodes.get('reset').click();assert.equal(vm.runInContext('E.counts(state).sage',a.ctx),8);assert.equal(vm.runInContext('(state.interventions||[]).length',a.ctx),0);
});
test('management selects up to five seeds and shows unavailable tools without activating them',()=>{
 const a=app();a.nodes.get('mode-mitigation').click();assert.equal(a.nodes.get('tool-burn').disabled,true);assert.equal(a.nodes.get('tool-chemicals').disabled,true);
 const empty=vm.runInContext("state.board.map((v,i)=>v==='empty'?i:-1).filter(i=>i>=0).slice(0,6)",a.ctx);
 a.nodes.get('tool-seed').click();empty.forEach(i=>a.nodes.get('board').children[i].click());a.nodes.get('tool-apply').click();assert.equal(vm.runInContext('E.counts(state).sageSeed',a.ctx),5);
});
test('management mower preview is discarded on season advance and fire roll does not grant another action',()=>{
 const a=app();a.nodes.get('mode-mitigation').click();a.nodes.get('tool-mower-row').click();a.nodes.get('board').children[0].click();a.click();assert.equal(a.nodes.get('tool-apply').disabled,true);
 a.click();a.click();assert.equal(a.nodes.get('advance').textContent,'Roll d100');a.setRandom(.99);a.click();assert.equal(a.nodes.get('tool-hoe').disabled,true);a.click();assert.equal(a.nodes.get('tool-hoe').disabled,false);
});

test('returning to an edited starting spring reports a preserved trial rather than initial counts',()=>{
 const a=app();a.nodes.get('mode-mitigation').click();const sage=vm.runInContext("state.board.indexOf('sage')",a.ctx);
 a.nodes.get('tool-hoe').click();a.nodes.get('board').children[sage].click();a.nodes.get('tool-apply').click();
 a.nodes.get('mode-native').click();a.nodes.get('mode-mitigation').click();
 assert.match(a.nodes.get('feedback').textContent,/previous trial has been preserved/);
});
