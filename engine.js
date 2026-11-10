/* Independent Cheatgrass model. Provisional choices are documented in PLAN.txt. */
(function(root){
'use strict';
const seasons=['Spring','Summer','Fall','Fire Season','Winter'];
function neighbors(i){const out=[],r=Math.floor(i/10),c=i%10;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const nr=r+dr,nc=c+dc;if((dr||dc)&&nr>=0&&nr<10&&nc>=0&&nc<10)out.push(nr*10+nc);}return out;}
function counts(s){const c={sage:0,sageSeed:0,cheat:0,dead:0,cheatSeed:0,empty:0};for(const v of s.board)c[v]++;return {...c,cheatPlants:c.cheat+c.dead,cheatSeeds:c.cheatSeed+c.dead,fuel:c.sage+c.dead,occupied:100-c.empty};}
function finish(s){const c=counts(s);return {...s,ended:c.sage+c.sageSeed===0};}
function create(random=Math.random,mode='invaded'){
 const positions=Array.from({length:100},(_,i)=>i);
 for(let i=99;i>0;i--){const j=Math.floor(random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
 const board=Array(100).fill('empty');positions.slice(0,8).forEach(i=>board[i]='sage');if(mode!=='native')positions.slice(8,12).forEach(i=>board[i]='cheat');
 return {mode,board,season:'Spring',year:0,ended:false,lastFire:null,fireResolved:false,history:[],fires:[]};
}
function advance(s,random=Math.random){
 if(s.ended||(s.season==='Fire Season'&&!s.fireResolved))return s;
 const n={...s,board:[...s.board],season:seasons[(seasons.indexOf(s.season)+1)%seasons.length]};
 if(n.season==='Summer'){
  s.board.forEach((v,i)=>{if(v==='cheat')n.board[i]='dead';});
  s.board.forEach((v,i)=>{if(v==='cheat')for(const j of neighbors(i)){if(['empty','sageSeed','cheatSeed'].includes(s.board[j]))n.board[j]='cheatSeed';}});
 }else if(n.season==='Fall'){
  s.board.forEach((v,i)=>{if(v==='sage'){const choices=neighbors(i).filter(j=>n.board[j]==='empty');if(choices.length)n.board[choices[Math.floor(random()*choices.length)]]='sageSeed';}});
 }else if(n.season==='Fire Season'){n.fireResolved=false;
 }else if(n.season==='Winter'){n.board=s.board.map(v=>['dead','cheatSeed'].includes(v)?'cheat':v);
 }else if(n.season==='Spring'){n.board=s.board.map(v=>v==='sageSeed'?'sage':v);n.year=s.year+1;const c=counts(n);n.history=[...(s.history||[]),{year:n.year,sage:c.sage,cheat:c.cheatPlants}];}
 return finish(n);
}
function roll(s,random=Math.random){
 if(s.ended||s.season!=='Fire Season'||s.fireResolved)return s;
 const threshold=counts(s).fuel,dice=Math.floor(random()*100)+1,occurred=dice<threshold;
 const n={...s,board:[...s.board],fireResolved:true,lastFire:{roll:dice,threshold,occurred,year:s.year}};
 if(occurred){n.board=s.board.map(v=>v==='sage'?'empty':v==='dead'?'cheatSeed':v);n.fires=[...(s.fires||[]),{year:s.year,roll:dice,threshold}];}
 return finish(n);
}
const api={create,advance,roll,counts};
if(typeof module==='object'&&module.exports)module.exports=api;else root.Cheatgrass=api;
})(globalThis);


