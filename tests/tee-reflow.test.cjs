const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const fields = {precision:{value:'16'}, isoGridScale:{value:'12'}, isoGridMeasure:{value:''}, isoGridDimensionType:{value:'C-C'}};
const context = vm.createContext({document:{readyState:'loading',addEventListener(){},getElementById:id=>fields[id]||null},localStorage:{},setTimeout(){},console,assert});
for (const path of ['public/core1.js','public/iso-draw.js']) vm.runInContext(readFileSync(path,'utf8'),context);
vm.runInContext(String.raw`
const close = (actual, expected) => assert.ok(Math.abs(actual-expected)<1e-7, actual+' != '+expected);
const seg = (a,b,measure='') => ({a:{x:a,y:200},b:{x:b,y:200},measure,dimensionType:'C-C'});
const tee = x => ({x,y:200,type:'TEE',snapped:true,pipePoint:{x,y:200}});
isoGridSyncSpoolLegs = () => {};
isoGridRender = () => {};
// Real pipe split, then a single C-C edit through the measurement save path.
isoGridState.SHARED={segments:[seg(100,292)],symbols:[]};
assert.equal(isoGridSplitSegmentAt(0,{x:196,y:200},'TEE'),true);
isoGridSelectedSegment=0;
isoGridLastPoint={x:196,y:200};
document.getElementById('isoGridMeasure').value='2\'';
isoGridSaveSegmentInfo();
close(isoGridCurrent().segments[0].b.x,164);
close(isoGridCurrent().segments[1].a.x,164);
close(isoGridCurrent().symbols[0].x,164);
close(isoGridLastPoint.x,164);
isoGridSaveSegmentInfo();
close(isoGridCurrent().segments[0].b.x,164); // repeated save is stable
assert.equal(isoGridCurrent().segments[1].autoMeasureInches,48);
// Fully measured run: 2 ft out of 8 ft, with a connected branch and end flange.
isoGridState.SHARED={segments:[seg(100,196,'2\''),seg(196,292,'6\''),{a:{x:196,y:200},b:{x:196,y:300},measure:'4\''}],symbols:[tee(196),{x:196,y:300,type:'END_FLANGE',snapped:true}]};
assert.equal(isoGridReflowMeasuredRun(0),true);
close(isoGridCurrent().segments[0].b.x,148);
close(isoGridCurrent().segments[2].a.x,148);
close(isoGridCurrent().segments[2].b.x,148);
close(isoGridCurrent().symbols[1].x,148);
close(isoGridCurrent().segments[2].b.y,300);
// Moving the first tee onto the second tee's OLD position must not merge them.
isoGridState.SHARED={segments:[seg(100,200,'20\"'),seg(200,300,'5\"'),seg(300,400,'5\"')],symbols:[tee(200),tee(300)]};
assert.equal(isoGridReflowMeasuredRun(1),true);
close(isoGridCurrent().symbols[0].x,300);
close(isoGridCurrent().symbols[1].x,350);
close(isoGridCurrent().segments[1].a.x,300);
close(isoGridCurrent().segments[1].b.x,350);
// Between-grid positions survive save/reload and retain exact shared joints.
isoGridCurrent().segments[0].measure='7\"';
isoGridReflowMeasuredRun(0);
const before=JSON.stringify(isoGridCurrent());
isoGridSave(); isoGridState.SHARED={segments:[],symbols:[]}; isoGridLoad();
close(isoGridCurrent().segments[0].b.x,JSON.parse(before).segments[0].b.x);
close(isoGridCurrent().symbols[0].x,isoGridCurrent().segments[0].b.x);
// Reverse segment orientation is supported; invalid dimensions do not move nodes.
isoGridState.SHARED={segments:[seg(200,100,'2\''),seg(200,400,'6\'')],symbols:[tee(200)]};
assert.equal(isoGridReflowMeasuredRun(0),true);
close(isoGridCurrent().symbols[0].x,175);
const saved=JSON.stringify(isoGridCurrent());
isoGridCurrent().segments[0].measure='0';
assert.equal(isoGridReflowMeasuredRun(0),false);
close(isoGridCurrent().symbols[0].x,175);
console.log('PASS: split + C-C edit, partial/full dimensions, stable repeated saves, branch/flange attachment, multiple tees, persistence, reversed direction, invalid input');
`,context);
