'use strict';
const E=window.Cheatgrass,$=id=>document.getElementById(id);
let state=E.create(),selected=0;
const M=window.CheatgrassManagement;
const fireSound=window.CheatgrassSound.create();
let soundEnabled=false,fireEffectTimer=null;
let activeTool=null,targets=[],herbicideDrag=null,suppressClick=false;
const labels={deadBare:'Dead cheatgrass without seeds',empty:'Empty ground',sage:'Sagebrush plant',sageSeed:'Sagebrush seed',cheat:'Living cheatgrass',dead:'Dead cheatgrass',cheatSeed:'Cheatgrass seed'};
const descriptions={deadBare:'Herbicide prevented the seeds from growing. The dead plant remains as fuel, without viable seeds.',empty:'Available space for plants and seeds.',sage:'A mature sagebrush produces one seed in fall.',sageSeed:'A sagebrush seed grows in spring if cheatgrass has not taken its square.',cheat:'Cheatgrass dies in summer and spreads seeds to surrounding squares.',dead:'Dry cheatgrass is fuel and contains seeds. After a wildfire, it leaves a seed behind.',cheatSeed:'A cheatgrass seed germinates in winter, before sagebrush grows in spring.'};
const drawings={
sage:'<path d="M25 47V27m0 10L11 24m14 7L38 17m-13 8L19 12" fill="none" stroke="currentColor" stroke-width="3"/><path d="M7 22q-4-13 9-12q0-12 11-6q9-6 13 6q14 1 7 12q5 13-10 14q-7 7-14-1Q7 40 7 22" fill="currentColor" opacity=".75"/>',
cheat:'<path d="M25 48Q14 26 9 15m16 33Q34 24 43 12M25 48V6m-1 20L16 17m9 2L33 10m-8 24L36 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
dead:'<path d="M25 48L13 17m12 31L39 18M25 48V8m0 14l-8-7m8 15l9-9M10 12l6 2m19-1l7 2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M9 43h7m22-2h6" stroke="currentColor" stroke-width="3"/>',
sageSeed:'<ellipse cx="24" cy="28" rx="9" ry="13" fill="currentColor" transform="rotate(30 24 28)"/><path d="M18 36l12-17" stroke="#fffdf7" stroke-width="2"/>',
cheatSeed:'<path d="M15 37q-5-15 5-22q12 9 5 22Z" fill="currentColor"/><path d="M31 43q-4-12 4-18q10 8 4 18Z" fill="currentColor"/><path d="M20 16V6m15 19l4-13" stroke="currentColor" stroke-width="2"/>',
empty:'<circle cx="25" cy="27" r="1.3" fill="#b9aa8c"/>'};
function icon(type){return '<svg viewBox="0 0 50 54" aria-hidden="true" focusable="false">'+drawings[type==='deadBare'?'dead':type]+'</svg>';}
const cells=Array.from({length:100},(_,i)=>{const b=document.createElement('button');b.type='button';b.className='cell';b.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}boardClick(i);});b.addEventListener('pointerdown',ev=>{suppressClick=false;if(ev.pointerType==='mouse'&&ev.button===0&&activeTool==='chemicals'&&M.available(state))herbicideDrag={start:i,moved:false};});b.addEventListener('pointerenter',ev=>{if(!herbicideDrag)return;if(!ev.buttons){herbicideDrag=null;return;}if(i!==herbicideDrag.start){herbicideDrag.moved=true;targets=[herbicideDrag.start,i];renderTools();}});b.addEventListener('pointerup',()=>{if(herbicideDrag?.moved)suppressClick=true;herbicideDrag=null;});b.addEventListener('pointercancel',()=>{herbicideDrag=null;});b.addEventListener('keydown',ev=>{let j=i,r=Math.floor(i/10),c=i%10;if(ev.key==='ArrowRight')j=r*10+Math.min(9,c+1);else if(ev.key==='ArrowLeft')j=r*10+Math.max(0,c-1);else if(ev.key==='ArrowDown')j=Math.min(9,r+1)*10+c;else if(ev.key==='ArrowUp')j=Math.max(0,r-1)*10+c;else if(ev.key==='Home')j=r*10;else if(ev.key==='End')j=r*10+9;else return;ev.preventDefault();select(j);cells[j].focus();inspect(j);});$('board').append(b);return b;});
for(const type of ['sage','sageSeed','cheat','dead','cheatSeed']){const li=document.createElement('li');li.className=type;li.innerHTML=icon(type)+'<span>'+labels[type]+'</span>';$('legend').append(li);}
function select(i){selected=i;cells.forEach((b,j)=>{b.tabIndex=j===i?0:-1;b.setAttribute('aria-pressed',String(j===i));});}
function inspect(i){select(i);$('inspection').textContent='Row '+(Math.floor(i/10)+1)+', column '+(i%10+1)+': '+labels[state.board[i]]+'. '+descriptions[state.board[i]]+(E.treated(state,i)?' Herbicide-treated soil: germination is blocked through '+['Spring','Summer','Fall','Fire Season','Winter'][state.treatments[i]%5]+' of year '+Math.floor(state.treatments[i]/5)+'.':'');}
const messages={
Summer:'Summer: cheatgrass has dried out and spread seeds into surrounding available squares.',
Fall:'Fall: each sagebrush has tried to drop one seed into a neighboring empty square.',
'Fire Season':'Fire season: roll the d100 to find out whether a wildfire occurs.',
Winter:'Winter: cheatgrass seeds germinate, including the seeds held by dead cheatgrass.',
Spring:'Spring: sagebrush seeds have grown into plants. A new annual cycle is complete.'};
function renderAnnualChart(){
 const history=state.history,fires=state.fires;
 $('annual-plot').innerHTML=window.CheatgrassChart.render(history,fires);
 $('annual-rows').innerHTML=history.length?history.map(p=>'<tr><th scope="row">'+p.year+'</th><td>'+p.sage+'</td><td>'+p.cheat+'</td></tr>').join(''):'<tr><td colspan="3">No spring sample yet.</td></tr>';
 $('annual-fires').innerHTML=fires.length?fires.map(f=>'<li>Before spring '+(f.year+1)+': wildfire (d100 '+f.roll+', threshold '+f.threshold+').</li>').join(''):'<li>No wildfire recorded.</li>';
 const latest=history.at(-1);
 $('chart-summary').textContent=latest?'Latest sample: spring '+latest.year+' — '+latest.sage+' sagebrush and '+latest.cheat+' cheatgrass plants. '+fires.length+' wildfire(s) recorded.':state.ended?'The trial ended before the first spring sample. Any wildfire is still marked below.':'The first sample will appear after winter, when you reach the next spring.';
}
function renderDiceResult(){
 const f=state.lastFire;
 const waiting=state.season==='Fire Season'&&!state.fireResolved;
 $('dice-result').hidden=!f||waiting||state.season!=='Fire Season';
 if(!f||waiting||state.season!=='Fire Season')return;
 $('dice-result').className='dice-result '+(f.occurred?'dice-fire':'dice-safe');
 $('dice-outcome').textContent=f.occurred?'WILDFIRE':'NO WILDFIRE';
 $('dice-explanation').textContent='There was a '+f.threshold+'% chance of a fire occurring, based on the fuel density.'+(f.occurred?' The wildfire burned the plants, but left the seeds behind.':'');
}
function render(message){
 clearFireEffects();
 $('mode-title').textContent='SAGEBRUSH STEPPE · '+(state.mode==='mitigation'?'MODE 3 — MITIGATION':state.mode==='native'?'MODE 2 — PRE-SETTLEMENT':'MODE 1 — CHEATGRASS & SAGEBRUSH');
 $('mode-invaded').setAttribute('aria-pressed',String(state.mode==='invaded'));
 $('mode-native').setAttribute('aria-pressed',String(state.mode==='native'));
 $('mode-mitigation').setAttribute('aria-pressed',String(state.mode==='mitigation'));
 $('mode-description').textContent=state.mode==='mitigation'?'Use different tools to mitigate the effects of cheatgrass on the sagebrush steppe fire regime.':state.mode==='native'?'Observe the sagebrush steppe fire regime, before the introduction of invasive cheatgrass.':'Cheatgrass is an invasive plant that was introduced to the United States in the 1800s. Observe how cheatgrass has affected the fire regime in the sagebrush steppe ecosystem.';
 $('annual-heading').textContent='Annual plant populations — '+(state.mode==='mitigation'?'Mitigation strategies':state.mode==='native'?'Pre-settlement':'Cheatgrass & Sagebrush');
 const c=E.counts(state);
 cells.forEach((b,i)=>{const t=state.board[i];b.className='cell '+t;b.innerHTML=icon(t);b.setAttribute('aria-label','Row '+(Math.floor(i/10)+1)+', column '+(i%10+1)+': '+labels[t]);});select(selected);
 $('year').textContent=state.year===0?'Starting year · 0':'Completed years · '+state.year;
 $('season-heading').textContent=state.season;
 const waiting=state.season==='Fire Season'&&!state.fireResolved;
 $('advance').textContent=state.ended?'Trial ended':waiting?'See if a fire occurs':'Next Season';$('advance').disabled=state.ended;
 const seasonText={Spring:'Sagebrush grows from seed.',Summer:'Cheatgrass dies, spreading seeds in all directions and leaving a dry, dead plant.',Fall:'Sagebrush drops seeds and goes dormant.',Winter:'Cheatgrass grows from seed.'};
 $('next-hint').textContent=state.ended?'No sagebrush plants or seeds remain. Reset to try again.':waiting?'The chance of a fire occurring is '+c.fuel+'%, based on the fuel density.':state.season==='Fire Season'?'Continue to winter.':seasonText[state.season];
 if(state.mode==='native'&&['Summer','Winter'].includes(state.season)&&!state.ended)$('next-hint').textContent+=' No cheatgrass is present in this ecosystem.';
 if(state.mode==='mitigation'&&['Spring','Winter'].includes(state.season)&&!state.ended&&Object.keys(state.treatments||{}).some(i=>E.treated(state,i)))$('next-hint').textContent+=' Herbicide prevents germination on treated soil.';
 $('counts').innerHTML=[['Fuel density',c.fuel+'%'],['Sagebrush plants',c.sage],['Sagebrush seeds',c.sageSeed],['Cheatgrass plants',c.cheatPlants],['Cheatgrass seeds',c.cheatSeeds]].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('');
 $('feedback').textContent=message+(state.ended?' No sagebrush plants or seeds remain. This trial has ended.':'');
 inspect(selected);
 renderAnnualChart();
 renderDiceResult();
 renderTools();
}

const modeNames={invaded:'Cheatgrass & Sagebrush Fire Regime',native:'Pre-settlement Fire Regime',mitigation:'Wildfire Mitigation Strategies'};
const trials={invaded:state,native:null,mitigation:null};
function startMessage(){return state.mode==='native'?'This ecosystem starts with 8 sagebrush plants and no cheatgrass. Select Next Season to enter summer.':'The ecosystem starts with 8 sagebrush plants and 4 living cheatgrass plants. Select Next Season to enter summer.';}
function burnMessage(){return state.mode==='native'?'Sagebrush plants burned away; existing sagebrush seeds survived.':'Sagebrush plants burned away. Dead cheatgrass containing seeds left them behind; seedless dead plants burned away. Existing seeds survived.';}
function seasonMessage(){
 if(state.mode==='native'&&state.season==='Summer')return 'Summer: sagebrush remains on the board. There is no cheatgrass to spread seeds.';
 if(state.mode==='native'&&state.season==='Winter')return 'Winter: sagebrush seeds wait for spring. There is no cheatgrass to germinate.';
 if(state.mode==='mitigation'&&(state.season==='Winter'||state.season==='Spring'))return state.season+': seeds germinate outside treated soil. On treated soil, seeds disappear instead; dead cheatgrass stays as fuel without seeds.';
 return messages[state.season];
}
function switchMode(mode){
 if(state.mode===mode)return;
 clearTool();
 trials[state.mode]=state;
 state=trials[mode]||E.create(Math.random,mode);
 trials[mode]=state;selected=0;
 render('Viewing '+modeNames[mode]+'. '+(state.year===0&&state.season==='Spring'&&!state.interventions?.length?startMessage():'Your previous trial has been preserved. Continue when ready.'));
}
$('mode-invaded').addEventListener('click',()=>switchMode('invaded'));
$('mode-native').addEventListener('click',()=>switchMode('native'));
$('mode-mitigation').addEventListener('click',()=>switchMode('mitigation'));
$('advance').addEventListener('click',()=>{
 if(state.ended||M.available(state))return;
 clearTool();
 const waiting=state.season==='Fire Season'&&!state.fireResolved;
 const beforeFire=state.board.slice();
 state=waiting?E.roll(state):E.advance(state);
 let msg=waiting?(state.lastFire.occurred?'Wildfire: '+burnMessage():'The roll did not trigger a wildfire. The vegetation is unchanged.'):seasonMessage();
 if(waiting)msg='There was a '+state.lastFire.threshold+'% chance of a fire occurring, based on the fuel density. '+(state.lastFire.occurred?'The wildfire burned the plants, but left the seeds behind.':'No wildfire occurred.');
 render(msg);
 if(waiting&&state.lastFire.occurred)showFireEffects(beforeFire.map((v,i)=>['sage','dead','deadBare'].includes(v)?i:-1).filter(i=>i>=0));
});
$('reset').addEventListener('click',()=>{clearTool();state=E.create(Math.random,state.mode);trials[state.mode]=state;selected=0;render(startMessage());});
function clearTool(){activeTool=null;targets=[];herbicideDrag=null;suppressClick=false;}
const toolInstructions={
hoe:'Manual weeding: click on up to 5 different plants to dig them up.',
seed:'Re-seeding: Click on up to 5 different empty squares to place new sagebrush seeds.',
'mower-row':'Fire break: Remove all plants and seeds in a straight line from one side of the board to the other. Select a row.',
'mower-column':'Fire break: Remove all plants and seeds in a straight line from one side of the board to the other. Select a column.',
burn:'Prescribed burn: Click on any plant to set it on fire. The fire will spread between any nearby plants.',
chemicals:'Pre-emergent Herbicide: Drag across any area of the board to drop the herbicide. This will prevent any seeds from growing in that area for the next full year.'
};
function renderTools(note){
 const enabled=state.mode==='mitigation',available=M.available(state);
 $('tools-panel').hidden=!enabled;
 $('board').setAttribute('data-tool',available&&activeTool?activeTool:'');
 $('tool-instructions').textContent=activeTool?toolInstructions[activeTool]:available?'Choose a tool to see its instructions, or skip mitigation this season.':state.season==='Fire Season'?'Wildfire is an event between fall and winter. Mitigation resumes in winter.':'This season’s choice is complete. Continue when ready.';
 $('advance').disabled=state.ended||available;
 $('tool-skip').disabled=!available;

 for(const tool of Object.keys(M.names)){
  $('tool-'+tool).disabled=!available;
  $('tool-'+tool).setAttribute('aria-pressed',String(activeTool===tool));
 }

 const p=activeTool?M.preview(state,activeTool,targets):{cells:[],changes:[],message:'Choose a tool, then select targets on the board.'};
 cells.forEach((b,i)=>{const preview=p.cells.includes(i);b.className='cell '+state.board[i]+(E.treated(state,i)?' treated':'')+(preview?' tool-preview':'');b.setAttribute('aria-label','Row '+(Math.floor(i/10)+1)+', column '+(i%10+1)+': '+labels[state.board[i]]+(E.treated(state,i)?' — herbicide-treated soil':'')+(preview?' — tool preview':''));});
 $('tool-apply').disabled=!available||!p.changes.length;
 $('tool-cancel').disabled=!activeTool;
 $('tool-budget').textContent=state.ended?'Trial ended. Reset to try another strategy.':state.season==='Fire Season'?'No mitigation during the wildfire event.':available?'Tool actions remaining this season: 1':'Tool actions remaining this season: 0. Continue to the next season.';
 $('tool-status').textContent=note||(!available?'No tool action is available now.':p.message);
 $('grid-help').textContent=enabled&&activeTool?'Select target squares with a click or Enter/Space. Arrow keys move between squares. Review the preview, then Apply tool.':'Select a square to learn about it. Use arrow keys to explore the board.';
 $('tool-log').innerHTML=(state.interventions||[]).map(e=>'<li>Year '+e.year+' · '+e.season+' · '+(e.tool==='skip'?'Skipped mitigation':M.names[e.tool]+' · '+e.cells.length+' square(s) changed.')+'</li>').join('')||'<li>No management actions yet.</li>';
}
function boardClick(i){
 inspect(i);
 if(state.mode!=='mitigation'||!activeTool||!M.available(state))return;
 if(activeTool==='chemicals')targets=targets.length===1&&targets[0]!==i?[targets[0],i]:[i];
 else if(activeTool.startsWith('mower-')||activeTool==='burn')targets=[i];
 else if(targets.includes(i))targets=targets.filter(j=>j!==i);
 else{
  if(targets.length===5){renderTools('Maximum 5 targets. Deselect a square to choose another.');return;}
  const candidate=[...targets,i],p=M.preview(state,activeTool,candidate);
  if(!p.changes.length){renderTools(p.message);return;}
  targets=candidate;
 }
 renderTools();
}
for(const tool of Object.keys(M.names))$('tool-'+tool).addEventListener('click',()=>{if(!M.available(state))return;activeTool=tool;targets=[];renderTools(tool==='chemicals'?'Herbicide: drag with the mouse, or select two opposite corners by click or Enter/Space. Review the rectangle, then Apply tool.':tool==='burn'?'Prescribed burn: select one plant. The preview follows connected plants, including diagonals. Select Apply tool to burn them.':M.names[tool]+': select targets on the board.');});
$('tool-skip').addEventListener('click',()=>{const next=M.skip(state);if(next===state)return;state=next;clearTool();render('Mitigation skipped for this season. You can now continue.');});
$('tool-cancel').addEventListener('click',()=>{clearTool();renderTools('Selection cancelled. No action was used.');});
$('tool-apply').addEventListener('click',()=>{
 const burning=activeTool==='burn';
 const next=M.apply(state,activeTool,targets);
 if(next===state){renderTools();return;}
 const name=M.names[activeTool],changed=next.interventions.at(-1).cells.length;
 state=next;clearTool();render(name+' applied to '+changed+' square(s). Your tool action for this season has been used.');
 if(burning)showFireEffects(next.interventions.at(-1).cells);
});

function clearFireEffects(){window.clearTimeout(fireEffectTimer);fireEffectTimer=null;fireSound.stop();$('board').setAttribute('data-fire','false');cells.forEach(b=>b.setAttribute('data-burning','false'));}
function showFireEffects(indices){if(document.hidden||!indices.length)return;$('board').setAttribute('data-fire','true');indices.forEach(i=>cells[i].setAttribute('data-burning','true'));fireSound.play();fireEffectTimer=window.setTimeout(clearFireEffects,2000);}
$('sound-toggle').addEventListener('click',()=>{soundEnabled=fireSound.enable(!soundEnabled);$('sound-toggle').textContent=soundEnabled?'Sound: on':'Sound: off';$('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));});
document.addEventListener?.('visibilitychange',()=>{if(document.hidden)clearFireEffects();});
render(startMessage());

