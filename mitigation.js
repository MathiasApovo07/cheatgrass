(function(root){
'use strict';
const names={hoe:'Hoe',seed:'Seed Bag','mower-row':'Mower (row)','mower-column':'Mower (column)'};
const plants=['sage','cheat','dead'];
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
 }else{
  if(cells.length!==1)return invalid('Choose one row or one column.');
  const i=cells[0];cells=Array.from({length:10},(_,j)=>tool==='mower-row'?Math.floor(i/10)*10+j:j*10+i%10);
 }
 const changes=cells.filter(i=>tool==='seed'||s.board[i]!=='empty');
 if(!changes.length)return invalid('Nothing to remove here. Your action has not been used.');
 return {cells,changes,message:names[tool]+': '+changes.length+' square(s) will change. Select Apply tool to confirm.'};
}
function apply(s,tool,selection){
 const p=preview(s,tool,selection);if(!p.changes.length)return s;
 const board=s.board.slice();p.changes.forEach(i=>board[i]=tool==='seed'?'sageSeed':'empty');
 return {...s,board,ended:!board.some(v=>v==='sage'||v==='sageSeed'),toolSeason:key(s),interventions:[...(s.interventions||[]),{year:s.year,season:s.season,tool,cells:p.changes.slice()}]};
}
const api={available,preview,apply,names};
if(typeof module==='object'&&module.exports)module.exports=api;else root.CheatgrassManagement=api;
})(globalThis);
