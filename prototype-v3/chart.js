(function(root){
'use strict';
// Fire markers sit halfway between annual spring ticks: order only, not elapsed time.
function layout(history,fires){
 let maxYear=1;for(const p of history)maxYear=Math.max(maxYear,p.year);for(const f of fires)maxYear=Math.max(maxYear,f.year+1);
 const x=year=>60+676*year/maxYear,y=count=>264-2.4*count;
 return {maxYear,points:history.map(p=>({...p,x:x(p.year),sageY:y(p.sage),cheatY:y(p.cheat)})),markers:fires.map(f=>({...f,x:x(f.year+.5)}))};
}
function render(history,fires){
 const d=layout(history,fires),pieces=[];
 for(let count=0;count<=100;count+=25){const y=264-2.4*count;pieces.push('<path d="M60 '+y+'H736" stroke="#d9ddd3"/><text x="48" y="'+(y+5)+'" text-anchor="end">'+count+'</text>');}
 const step=Math.max(1,Math.ceil(d.maxYear/10));const ticks=[];for(let i=0;i<=d.maxYear;i+=step)ticks.push(i);if(ticks.at(-1)!==d.maxYear)ticks.push(d.maxYear);
 for(const year of ticks){const x=60+676*year/d.maxYear;pieces.push('<text x="'+x+'" y="288" text-anchor="middle">'+year+'</text>');}
 for(const f of d.markers)pieces.push('<g><title>Wildfire before spring '+(f.year+1)+': roll '+f.roll+', threshold '+f.threshold+'</title><path d="M'+f.x+' 28V264" stroke="#a43a20" stroke-width="2" stroke-dasharray="3 5"/><path d="M'+f.x+' 18l-6 10h12Z" fill="#a43a20"/></g>');
 for(const [key,color,dashed] of [['sage','#255742',false],['cheat','#7549a3',true]]){
 const pts=d.points.map(p=>p.x+','+p[key+'Y']).join(' ');
 if(d.points.length>1)pieces.push('<polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="3" '+(dashed?'stroke-dasharray="8 5"':'')+'/>');
 for(const p of d.points){const shape=dashed?'<rect x="'+(p.x-4)+'" y="'+(p.cheatY-4)+'" width="8" height="8"':'<circle cx="'+p.x+'" cy="'+p.sageY+'" r="5"';pieces.push(shape+' fill="'+color+'"><title>Spring '+p.year+': '+p[key]+' '+(key==='sage'?'sagebrush':'cheatgrass')+' plants</title>'+(dashed?'</rect>':'</circle>'));}
 }
 const summary=history.length?history.length+' annual spring samples. Latest spring '+history.at(-1).year+': '+history.at(-1).sage+' sagebrush and '+history.at(-1).cheat+' cheatgrass plants. '+fires.length+' wildfires.':'No annual sample yet. '+fires.length+' wildfires recorded.';
 return '<svg viewBox="0 0 760 330" role="img" aria-labelledby="chart-title chart-description"><title id="chart-title">Annual plant populations and wildfire events</title><desc id="chart-description">'+summary+' Full values and fire events are available below.</desc><text x="60" y="16">Plants</text>'+pieces.join('')+'<path d="M60 24V264H736" fill="none" stroke="#536257"/><text x="398" y="319" text-anchor="middle">Spring year (0 = initial setup, not sampled)</text></svg>';
}
const api={layout,render};if(typeof module==='object'&&module.exports)module.exports=api;else root.CheatgrassChart=api;
})(globalThis);
