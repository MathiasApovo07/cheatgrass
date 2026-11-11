const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine.js');
const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'../mitigation.js');
const M=fs.existsSync(file)?require(file):{};
const fixture=()=>({...E.create(()=>.42,'mitigation'),board:['sage','cheat','dead','sageSeed','cheatSeed',...Array(95).fill('empty')]});
test('hoe removes adult plants of either species but rejects seeds and more than five',()=>{let s=fixture();assert.equal(typeof M.apply,'function');let n=M.apply(s,'hoe',[0,1,2]);assert.deepEqual(n.board.slice(0,5),['empty','empty','empty','sageSeed','cheatSeed']);assert.equal(s.board[0],'sage');assert.equal(M.apply(s,'hoe',[3]),s);s.board.fill('sage');assert.equal(M.apply(s,'hoe',[0,1,2,3,4,5]),s);});
test('seed bag accepts only empty cells, at most five, and cannot overwrite vegetation',()=>{const s=fixture();const n=M.apply(s,'seed',[5,6,7,8,9]);assert.deepEqual(n.board.slice(5,10),Array(5).fill('sageSeed'));assert.equal(M.apply(s,'seed',[0]),s);assert.equal(M.apply(s,'seed',[5,6,7,8,9,10]),s);});
test('mower clears exactly one row or column including seeds',()=>{const s=fixture();s.board[10]='sage';let n=M.apply(s,'mower-row',[2]);assert.deepEqual(n.board.slice(0,10),Array(10).fill('empty'));assert.equal(n.board[10],'sage');n=M.apply(s,'mower-column',[0]);assert.equal(n.board[0],'empty');assert.equal(n.board[10],'empty');assert.equal(n.board[1],'cheat');});
test('one committed tool action per season, no-op does not spend it, next season restores it',()=>{const s=fixture();assert.equal(M.apply(s,'hoe',[8]),s);const n=M.apply(s,'seed',[5]);assert.equal(M.available(n),false);assert.equal(M.apply(n,'hoe',[0]),n);assert.equal(M.available(E.advance(n,()=>.42)),true);assert.equal(n.interventions.length,1);});
test('tools reject wrong mode, ended trial, malformed cells and resolved fire season',()=>{const s=fixture();for(const selection of [[],[-1],[100],[1.5],[NaN],[0,0]])assert.equal(M.apply(s,'hoe',selection),s);assert.equal(M.apply({...s,mode:'native'},'hoe',[0]).board[0],'sage');assert.equal(M.apply({...s,ended:true},'hoe',[0]).board[0],'sage');assert.equal(M.available({...s,season:'Fire Season',fireResolved:true}),false);});
test('preview is non-mutating and tool-caused extinction ends the trial without inventing spring data',()=>{const s=fixture();s.board[3]='empty';const snapshot=JSON.stringify(s);const p=M.preview(s,'hoe',[0]);assert.deepEqual(p.cells,[0]);assert.equal(JSON.stringify(s),snapshot);const n=M.apply(s,'hoe',[0]);assert.equal(n.ended,true);assert.equal(n.history.length,0);});

test('prescribed burn follows diagonal plant chains but not seeds, gaps or wrapped edges',()=>{
 const s={...fixture(),board:Array(100).fill('empty')};
 for(const [i,v] of [[0,'sage'],[11,'cheat'],[22,'dead'],[23,'sageSeed'],[24,'sage'],[9,'sage'],[10,'cheatSeed']])s.board[i]=v;
 const before=JSON.stringify(s);assert.deepEqual(M.preview(s,'burn',[0]).cells.sort((a,b)=>a-b),[0,11,22]);assert.equal(JSON.stringify(s),before);
 const n=M.apply(s,'burn',[0]);assert.equal(n.board[0],'empty');assert.equal(n.board[11],'empty');assert.equal(n.board[22],'cheatSeed');assert.equal(n.board[23],'sageSeed');assert.equal(n.board[24],'sage');assert.equal(n.board[9],'sage');assert.equal(n.board[10],'cheatSeed');
});
test('burn can cover more than five plants and spends exactly one seasonal action',()=>{
 const s={...fixture(),board:Array(100).fill('cheat')};s.board[99]='sageSeed';const n=M.apply(s,'burn',[0]);assert.equal(n.interventions.at(-1).cells.length,99);assert.equal(n.board[99],'sageSeed');assert.equal(M.available(n),false);assert.equal(M.apply(n,'burn',[99]),n);assert.equal(n.history.length,0);assert.equal(n.fires.length,0);
});
test('burn rejects nonplants, multiple origins, other modes and ended trials',()=>{
 const s=fixture();for(const selection of [[3],[4],[5],[0,1],[],[-1],[100]])assert.equal(M.apply(s,'burn',selection),s);
 for(const modified of [{...s,mode:'invaded'},{...s,mode:'native'},{...s,ended:true}])assert.equal(M.apply(modified,'burn',[0]),modified);
});
test('prescribed burn extinction and surviving seeds follow the existing lifecycle',()=>{
 let s={...fixture(),board:Array(100).fill('empty')};s.board[0]='sage';assert.equal(M.apply(s,'burn',[0]).ended,true);
 s.board[1]='sageSeed';s.board[11]='dead';let n=M.apply(s,'burn',[0]);assert.equal(n.ended,false);assert.equal(n.board[1],'sageSeed');assert.equal(n.board[11],'cheatSeed');
 n={...n,season:'Fire Season',fireResolved:true};n=E.advance(n);assert.equal(n.board[11],'cheat');assert.equal(n.board[1],'sageSeed');n=E.advance(n);assert.equal(n.board[1],'sage');
});
