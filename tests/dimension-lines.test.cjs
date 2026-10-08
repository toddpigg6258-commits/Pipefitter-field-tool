const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c=vm.createContext({document:{readyState:'loading',addEventListener(){}},assert});
vm.runInContext(fs.readFileSync('public/iso-draw.js','utf8'),c);
vm.runInContext(`
for(const kind of ['measure','rise','run']) {
 const make=offset=>isoGridDimensionMarkup(2,kind,{x:10,y:20},{x:110,y:120},{x:30,y:40},{x:130,y:140},offset,'2 ft',0.85,30);
 const coords=markup=>Array.from(markup.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"/g),m=>m.slice(1).map(Number));
 const initial=coords(make({x:0,y:0})), moved=coords(make({x:45,y:-25}));
 assert.equal(moved.length,3); // two witness lines + dimension; no middle connector
 for(let i=0;i<3;i++) {
  assert.deepEqual(moved[i].slice(0,2),i<2?initial[i].slice(0,2):[initial[i][0]+45,initial[i][1]-25]);
  assert.deepEqual(moved[i].slice(2),[initial[i][2]+45,initial[i][3]-25]);
 }
 assert(make({x:45,y:-25}).includes('rotate(30 125 65)'));
 assert(make({x:45,y:-25}).includes('data-grid-'+kind+'="2"'));
}`,c);
console.log('PASS: C-C/rise/run dotted endpoints move with labels; pipe anchors stay fixed; rotation/drag hooks retained; no middle connector');
