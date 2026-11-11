(function(root){
'use strict';
const E=typeof module==='object'&&module.exports?require('./engine.js'):root.Cheatgrass;
const names={hoe:'Hoe',seed:'Seed Bag','mower-row':'Mower (row)','mower-column':'Mower (column)',burn:'Prescribed Burn',chemicals:'Pre-emergent Herbicide'};
const plants=['sage','cheat','dead','deadBare'];
const key=s=>s.year+':'+s.season;
function available(s){return s.mode==='mitigation'&&!s.ended&&!(s.season==='Fire Season'&&s.fireResolved)&&s.toolSeason!==key(s);}
function preview(s,tool,selection){
 const invalid=message=>({cells:[],changes:[],message});
 if(!available(s))return invalid('No tool action is available in this season.');
 if(!Object.hasOwn(names,tool))return invalid('Choose an available tool.');
 if(!Array.isArray(selection)||!selection.length)return invalid('Select squares on the board.');
 if(selection.some(i=>!Number.isInteger(i)||i<0||i>=100)||new Set(selection).size!==selection.length)return invalid('Invalid square selection.');
 let cells=selection.slice();
 if(tool==='hoe'||tool==='seed'){
  if(cells.length>5)return invalid('Select at most 5 squares.');
  if(cells.some(i=>tool==='hoe'?!plants.includes(s.board[i]):s.board[i]!=='empty'))return invalid(tool==='hoe'?'Hoe targets plants, not seeds or empty ground.':'Seed Bag needs empty squares.');
 }else if(tool==='chemicals'){
  if(cells.length>2)return invalid('Select two opposite corners of a rectangle.');
  const a=cells[0],b=cells.at(-1);cells=[];
  for(let r=Math.min(Math.floor(a/10),Math.floor(b/10));r<=Math.max(Math.floor(a/10),Math.floor(b/10));r++)for(let c=Math.min(a%10,b%10);c<=Math.max(a%10,b%10);c++)cells.push(r*10+c);
 }else if(tool==='burn'){
  if(cells.length!==1||!plants.includes(s.board[cells[0]]))return invalid('Select one plant to start a prescribed burn.');
  const visited=new Set(cells),queue=cells.slice();
  for(let k=0;k<queue.length;k++){
   const r=Math.floor(queue[k]/10),c=queue[k]%10;
   for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const nr=r+dr,nc=c+dc,j=nr*10+nc;
    if((dr||dc)&&nr>=0&&nr<10&&nc>=0&&nc<10&&!visited.has(j)&&plants.includes(s.board[j])){visited.add(j);queue.push(j);}
   }
  }
  cells=queue;
 }else{
  if(cells.length!==1)return invalid('Choose one row or one column.');
  const i=cells[0];cells=Array.from({length:10},(_,j)=>tool==='mower-row'?Math.floor(i/10)*10+j:j*10+i%10);
 }
 const changes=cells.filter(i=>tool==='seed'||tool==='chemicals'||s.board[i]!=='empty');
 if(!changes.length)return invalid('Nothing to remove here. Your action has not been used.');
 return {cells,changes,message:names[tool]+': '+changes.length+' square(s) will change. Select Apply tool to confirm.'};
}
function apply(s,tool,selection){
 const p=preview(s,tool,selection);if(!p.changes.length)return s;
 const board=s.board.slice();const treatments={...s.treatments};if(tool==='chemicals')p.changes.forEach(i=>treatments[i]=E.tick(s)+5);else p.changes.forEach(i=>board[i]=tool==='seed'?'sageSeed':tool==='burn'&&s.board[i]==='dead'?'cheatSeed':'empty');
 return {...s,board,...(tool==='chemicals'?{treatments}:{}),ended:!board.some(v=>v==='sage'||v==='sageSeed'),toolSeason:key(s),interventions:[...(s.interventions||[]),{year:s.year,season:s.season,tool,cells:p.changes.slice()}]};
}
function skip(s){if(!available(s))return s;return {...s,toolSeason:key(s),interventions:[...(s.interventions||[]),{year:s.year,season:s.season,tool:'skip',cells:[]}]};}
const api={available,preview,apply,skip,names};
if(typeof module==='object'&&module.exports)module.exports=api;else root.CheatgrassManagement=api;
})(globalThis);
