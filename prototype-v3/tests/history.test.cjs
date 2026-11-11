const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine.js');
function fixture(entries,season='Winter'){const s=E.create(()=>.4);s.board.fill('empty');for(const [i,v] of Object.entries(entries))s.board[i]=v;s.season=season;return s;}
test('annual sample is captured only after spring growth, with plants not seeds',()=>{
 let s=fixture({0:'sage',1:'sageSeed',2:'cheat',3:'cheatSeed'});
 assert.deepEqual(s.history,[]);
 const p=E.advance(s);assert.deepEqual(p.history,[{year:1,sage:2,cheat:1}]);assert.deepEqual(s.history,[]);
 s=E.advance(p);assert.deepEqual(s.history,p.history);
 s=E.advance(s,()=>0);assert.deepEqual(s.history,p.history);
 s=E.advance(s);assert.deepEqual(s.history,p.history);
 s=E.roll(s,()=>.99);assert.deepEqual(s.history,p.history);assert.deepEqual(s.fires,[]);
 s=E.advance(s);assert.deepEqual(s.history,p.history);
 s=E.advance(s);assert.equal(s.history.length,2);assert.equal(s.history[1].year,2);assert.deepEqual(p.history,[{year:1,sage:2,cheat:1}]);
});
test('fire marker persists even if extinction happens before any annual sample',()=>{
 const s=fixture({0:'sage',1:'dead'},'Fire Season'),r=E.roll(s,()=>0);
 assert.equal(r.ended,true);assert.deepEqual(r.history,[]);assert.deepEqual(r.fires,[{year:0,roll:1,threshold:2}]);
 assert.deepEqual(E.roll(r,()=>0).fires,r.fires);assert.deepEqual(s.fires,[]);
});
test('successive fire events are kept independently of annual samples',()=>{
 let s=fixture({0:'sage',1:'dead',2:'sageSeed'},'Fire Season');s=E.roll(s,()=>0);s=E.advance(s);s=E.advance(s);
 const first=s.history[0];assert.deepEqual(first,{year:1,sage:1,cheat:1});
 s=E.advance(s);s=E.advance(s,()=>0);s=E.advance(s);s=E.roll(s,()=>0);
 assert.equal(s.fires.length,2);assert.deepEqual(s.fires.map(f=>f.year),[0,1]);assert.deepEqual(s.history,[first]);
});
test('reset creates fresh empty history and fire lists',()=>{const a=E.create();a.history.push({year:1,sage:2,cheat:3});a.fires.push({year:0,roll:1,threshold:2});const b=E.create();assert.deepEqual(b.history,[]);assert.deepEqual(b.fires,[]);});
