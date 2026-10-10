let isoGridView = 'ISO';
let isoGridZoom = 1;
let isoGridMode = 'LINE';
let isoGridLastPoint = null;
let isoGridSelectedSegment = -1;
let isoGridSelectedSymbol = -1;
let isoFieldPhotoObjectUrl = '';
let isoFieldPhotoVisible = true;
let isoGridVisible = true;
let isoGridMeasurementMode = 'AUTO';
let isoGridSnapEnabled = true;
let isoGridTapGuard = null;
let isoGridPinchActive = false;
let isoGridPinchSuppressUntil = 0;
let isoGridPanActive = false;
let isoGridEndpointDragging = false;
let isoGridPanSuppressUntil = 0;
let isoGridFittingDragActive = false;
let isoGridSegmentSerial = 0;
let isoGridMeasurementDragUntil = 0;
let isoGridState = {
  SHARED: { segments: [], symbols: [] },
};

const ISO_GRID_WIDTH = 1200;
const ISO_GRID_HEIGHT = 900;
const ISO_GRID_STEP = 24;
const ISO_GRID_NODE_SNAP = 30;

function isoGridCurrent() {
  return isoGridState.SHARED;
}

function isoGridEsc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isoGridSave() {
  try {
    localStorage.pf_iso_grid_v32 = JSON.stringify({
      view: isoGridView,
      zoom: isoGridZoom,
      state: isoGridState,
      selectedSegment: isoGridSelectedSegment,
      selectedSymbol: isoGridSelectedSymbol,
      scale: isoGridScaleInches(),
      gridVisible: isoGridVisible,
      measurementMode: isoGridMeasurementMode,
      measurementsVisible: isoGridMeasurementMode !== 'OFF',
      snapEnabled: isoGridSnapEnabled,
    });
  } catch {}
}

function isoGridLoad() {
  try {
    const raw = localStorage.pf_iso_grid_v32 || localStorage.pf_iso_grid_v31 || localStorage.pf_iso_grid_v30 || localStorage.pf_iso_grid_v29 || localStorage.pf_iso_grid_v28 || localStorage.pf_iso_grid_v27 || localStorage.pf_iso_grid_v26 || localStorage.pf_iso_grid_v25 || localStorage.pf_iso_grid_v24 || localStorage.pf_iso_grid_v23 || localStorage.pf_iso_grid_v22 || localStorage.pf_iso_grid_v21 || localStorage.pf_iso_grid_v20 || localStorage.pf_iso_grid_v19 || '{}';
    const saved = JSON.parse(raw);
    if (typeof saved.gridVisible === 'boolean') isoGridVisible = saved.gridVisible;
    if (['AUTO', 'ALL', 'OFF'].includes(saved.measurementMode)) isoGridMeasurementMode = saved.measurementMode;
    else if (typeof saved.measurementsVisible === 'boolean') isoGridMeasurementMode = saved.measurementsVisible ? 'AUTO' : 'OFF';
    if (typeof saved.snapEnabled === 'boolean') isoGridSnapEnabled = saved.snapEnabled;
    if (saved.state?.SHARED) {
      isoGridState = { SHARED: saved.state.SHARED };
    } else if (saved.state) {
      const preferred = [saved.view, 'ISO', 'PLAN', 'ELEVATION']
        .filter((value, index, list) => value && list.indexOf(value) === index)
        .map(key => saved.state[key])
        .find(view => view && ((view.segments?.length || 0) + (view.symbols?.length || 0) > 0));
      const fallback = saved.state.ISO || saved.state.PLAN || saved.state.ELEVATION;
      if (preferred || fallback) isoGridState = { SHARED: preferred || fallback };
    }
    Object.values(isoGridState).forEach(view => {
      view.segments = Array.isArray(view.segments) ? view.segments : [];
      view.symbols = Array.isArray(view.symbols) ? view.symbols.filter(symbol => !symbol.auto) : [];
      view.segments.forEach(segment => {
        // Saved tee positions may lie between grid dots; never snap them on reload.
        const normalizePoint = isoGridModelPoint;
        segment.a = normalizePoint(segment.a || { x: 0, y: 0 });
        segment.b = normalizePoint(segment.b || { x: 0, y: 0 });
        if (segment.measure == null) segment.measure = '';
        if (['RISE', 'ROLL', 'OFFSET'].includes(segment.dimensionType)) { segment.offsetType = segment.offsetType || segment.dimensionType; segment.offsetMeasure = segment.offsetMeasure || segment.measure || ''; segment.dimensionType = 'C-C'; segment.measure = ''; }
        if (!['C-C', 'E-E', 'C-F', 'F-F', 'C-E'].includes(segment.dimensionType)) segment.dimensionType = 'C-C';
        if (segment.riseMeasure == null) segment.riseMeasure = segment.offsetType === 'RISE' ? (segment.offsetMeasure || '') : '';
        if (segment.runMeasure == null) segment.runMeasure = segment.rollMeasure || (['ROLL', 'OFFSET'].includes(segment.offsetType) ? (segment.offsetMeasure || '') : '');
        if (segment.note == null) segment.note = '';
        if (segment.complete == null) segment.complete = false;
      });
      view.symbols.forEach(symbol => {
        if (!isFinite(symbol.rotation)) symbol.rotation = 0;
        if (isoGridIsTee(symbol.type) && !isFinite(symbol.branchRotation)) symbol.branchRotation = 0;
        if (symbol.splitNode && !symbol.pipePoint) symbol.pipePoint = { x: symbol.x, y: symbol.y };
        const normalized = symbol.annotation ? isoGridClampPoint(symbol) : isoGridModelPoint(symbol);
        symbol.x = normalized.x;
        symbol.y = normalized.y;
      });
    });
    if (['ISO', 'PLAN', 'ELEVATION'].includes(saved.view)) isoGridView = saved.view;
    if (isFinite(saved.zoom)) isoGridZoom = Math.max(0.8, Math.min(2.8, +saved.zoom));
    if (isFinite(saved.selectedSegment)) isoGridSelectedSegment = saved.selectedSegment;
    if (isFinite(saved.selectedSymbol)) isoGridSelectedSymbol = saved.selectedSymbol;
    if (isFinite(saved.scale)) {
      setTimeout(() => {
        const scale = $('isoGridScale');
        if (scale) scale.value = String(saved.scale);
      }, 0);
    }
  } catch {}
}

function isoGridSetStatus(message) {
  const status = $('isoGridStatus');
  if (status) status.innerHTML = message;
}

function isoGridScaleInches() {
  const select = $('isoGridScale');
  const value = select ? parseFloat(select.value) : 12;
  return isFinite(value) && value > 0 ? value : 12;
}

function isoGridApplyDisplayState() {
  const overlay = document.querySelector('.iso-photo-grid-overlay');
  if (overlay) overlay.classList.toggle('hidden', !isoGridVisible);
  const gridButton = $('isoGridToggle');
  if (gridButton) {
    gridButton.textContent = isoGridVisible ? 'GRID ON' : 'GRID OFF';
    gridButton.classList.toggle('on', isoGridVisible);
  }
  const measureButton = $('isoMeasureToggle');
  if (measureButton) {
    measureButton.textContent = `MEASURE ${isoGridMeasurementMode}`;
    measureButton.classList.toggle('on', isoGridMeasurementMode !== 'OFF');
  }
  const snapButton = $('isoSnapToggle');
  if (snapButton) {
    snapButton.textContent = isoGridSnapEnabled ? 'SNAP ON' : 'SNAP OFF';
    snapButton.classList.toggle('on', isoGridSnapEnabled);
  }
}

function isoGridToggleGrid() {
  isoGridVisible = !isoGridVisible;
  isoGridApplyDisplayState();
  isoGridSetStatus(isoGridVisible ? 'Grid shown. Your pipe drawing is unchanged.' : 'Grid hidden. Your pipe drawing is unchanged; SNAP can stay on or be turned off separately.');
  isoGridSave();
}

function isoGridToggleMeasurements() {
  isoGridMeasurementMode = isoGridMeasurementMode === 'AUTO' ? 'ALL' : isoGridMeasurementMode === 'ALL' ? 'OFF' : 'AUTO';
  isoGridApplyDisplayState();
  const messages = { AUTO: 'MEASURE AUTO: only the selected pipe shows its dimensions while you work.', ALL: 'MEASURE ALL: every pipe dimension is shown for review.', OFF: 'MEASURE OFF: dimension callouts are hidden so the drawing stays clear.' };
  isoGridSetStatus(messages[isoGridMeasurementMode]);
  isoGridSave();
  isoGridRender();
}

function isoGridToggleSnap() {
  isoGridSnapEnabled = !isoGridSnapEnabled;
  isoGridApplyDisplayState();
  isoGridSetStatus(isoGridSnapEnabled ? 'SNAP ON: endpoint drags land on grid points. Finger taps for new pipe always land on the grid.' : 'SNAP OFF: finger taps still land on the grid; hold and drag pipe endpoints freely to trace over a field photo.');
  isoGridSave();
}

function isoGridClampPoint(point) {
  return {
    x: Math.max(0, Math.min(ISO_GRID_WIDTH, Number(point?.x) || 0)),
    y: Math.max(0, Math.min(ISO_GRID_HEIGHT, Number(point?.y) || 0)),
  };
}

function isoGridModelPoint(point) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
}

function isoGridSnapPoint(point) {
  const clamped = isoGridClampPoint(point);
  return {
    x: Math.round(clamped.x / ISO_GRID_STEP) * ISO_GRID_STEP,
    y: Math.round(clamped.y / ISO_GRID_STEP) * ISO_GRID_STEP,
  };
}

function isoGridViewMatrix(mode = isoGridView) {
  if (mode === 'ISO') return { a: 0.72, b: 0.32, c: -0.27, d: 0.60 };
  if (mode === 'ELEVATION') return { a: 0, b: -0.72, c: 0.72, d: 0 };
  return { a: 1, b: 0, c: 0, d: 1 };
}

function isoGridToViewPoint(point, mode = isoGridView) {
  const matrix = isoGridViewMatrix(mode);
  const cx = ISO_GRID_WIDTH / 2;
  const cy = ISO_GRID_HEIGHT / 2;
  const dx = (Number(point?.x) || 0) - cx;
  const dy = (Number(point?.y) || 0) - cy;
  return {
    x: cx + matrix.a * dx + matrix.b * dy,
    y: cy + matrix.c * dx + matrix.d * dy,
  };
}

function isoGridFromViewPoint(point, mode = isoGridView) {
  const matrix = isoGridViewMatrix(mode);
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (Math.abs(determinant) < 1e-9) return isoGridModelPoint(point);
  const cx = ISO_GRID_WIDTH / 2;
  const cy = ISO_GRID_HEIGHT / 2;
  const sx = (Number(point?.x) || 0) - cx;
  const sy = (Number(point?.y) || 0) - cy;
  return isoGridModelPoint({
    x: cx + (matrix.d * sx - matrix.b * sy) / determinant,
    y: cy + (-matrix.c * sx + matrix.a * sy) / determinant,
  });
}

function isoGridSnapIsoDisplayPoint(point) {
  const clamped = isoGridClampPoint(point);
  const stepX = ISO_GRID_STEP;
  const verticalStep = ISO_GRID_STEP / Math.cos(Math.PI / 6);
  const column = Math.round(clamped.x / stepX);
  const yOffset = Math.abs(column % 2) * verticalStep / 2;
  return isoGridClampPoint({
    x: column * stepX,
    y: Math.round((clamped.y - yOffset) / verticalStep) * verticalStep + yOffset,
  });
}

function isoGridSnapDisplayPoint(point) {
  return isoGridView === 'ISO' ? isoGridSnapIsoDisplayPoint(point) : isoGridSnapPoint(point);
}

function isoGridCanonicalIsoPoint(point) {
  const display = point?.isoDisplayPoint
    ? isoGridModelPoint(point.isoDisplayPoint)
    : isoGridToViewPoint(isoGridModelPoint(point), 'ISO');
  const snappedDisplay = isoGridSnapIsoDisplayPoint(display);
  const model = isoGridFromViewPoint(snappedDisplay, 'ISO');
  model.isoDisplayPoint = snappedDisplay;
  return model;
}

function isoGridDisplayEventPoint(event, snap = true, forceGrid = false) {
  const scene = $('isoTapScene');
  if (!scene) return null;
  const rect = scene.getBoundingClientRect();
  const scaleX = rect.width > 0 ? rect.width / ISO_GRID_WIDTH : isoGridZoom;
  const scaleY = rect.height > 0 ? rect.height / ISO_GRID_HEIGHT : isoGridZoom;
  let displayPoint = {
    x: (event.clientX - rect.left) / scaleX,
    y: (event.clientY - rect.top) / scaleY,
  };
  displayPoint = isoGridClampPoint(displayPoint);
  if (forceGrid || (snap && isoGridSnapEnabled)) displayPoint = isoGridSnapDisplayPoint(displayPoint);
  return displayPoint;
}

function isoGridEventPoint(event, snap = true, forceGrid = false) {
  const displayPoint = isoGridDisplayEventPoint(event, snap, forceGrid);
  if (!displayPoint) return null;
  const modelPoint = isoGridFromViewPoint(displayPoint);
  if (isoGridView === 'ISO' && (forceGrid || (snap && isoGridSnapEnabled))) modelPoint.isoDisplayPoint = { ...displayPoint };
  return modelPoint;
}

function isoGridConstrainDisplayLine(startPoint, targetPoint) {
  if (isoGridView !== 'ISO' || !startPoint || !targetPoint) return targetPoint;
  const start = startPoint.isoDisplayPoint || isoGridToViewPoint(startPoint);
  const target = targetPoint.isoDisplayPoint || isoGridToViewPoint(targetPoint);
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  if (Math.hypot(dx, dy) < 0.5) return targetPoint;
  const halfRise = ISO_GRID_STEP * Math.tan(Math.PI / 6);
  const verticalStep = ISO_GRID_STEP / Math.cos(Math.PI / 6);
  const bases = [
    { x: 0, y: verticalStep },
    { x: ISO_GRID_STEP, y: halfRise },
    { x: ISO_GRID_STEP, y: -halfRise },
  ];
  let best = null;
  bases.forEach(base => {
    const lengthSquared = base.x * base.x + base.y * base.y;
    const steps = Math.round((dx * base.x + dy * base.y) / lengthSquared);
    if (!steps) return;
    const candidate = { x: start.x + steps * base.x, y: start.y + steps * base.y };
    const error = Math.hypot(candidate.x - target.x, candidate.y - target.y);
    if (!best || error < best.error) best = { point: candidate, error };
  });
  if (!best) return targetPoint;
  const constrained = isoGridFromViewPoint(best.point);
  constrained.isoDisplayPoint = { ...best.point };
  return constrained;
}

function isoGridSnapPointToSegmentGrid(segment, point, interior = false, forceGrid = false) {
  const dx = segment.b.x - segment.a.x;
  const dy = segment.b.y - segment.a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return { ...segment.a };
  const viewA = isoGridToViewPoint(segment.a);
  const viewB = isoGridToViewPoint(segment.b);
  const viewPoint = isoGridToViewPoint(point);
  const viewDx = viewB.x - viewA.x;
  const viewDy = viewB.y - viewA.y;
  const viewLengthSquared = viewDx * viewDx + viewDy * viewDy;
  const rawT = viewLengthSquared
    ? ((viewPoint.x - viewA.x) * viewDx + (viewPoint.y - viewA.y) * viewDy) / viewLengthSquared
    : 0;
  if (!isoGridSnapEnabled && !forceGrid) {
    const edge = interior ? Math.min(0.45, 8 / Math.sqrt(lengthSquared)) : 0;
    const t = Math.max(edge, Math.min(1 - edge, rawT));
    return isoGridModelPoint({ x: segment.a.x + t * dx, y: segment.a.y + t * dy });
  }
  const dxSteps = Math.round(viewDx / ISO_GRID_STEP);
  const dySteps = Math.round(viewDy / ISO_GRID_STEP);
  const divisions = gcd(Math.abs(dxSteps), Math.abs(dySteps));
  if (!divisions) return { ...segment.a };
  let stepIndex = Math.round(Math.max(0, Math.min(1, rawT)) * divisions);
  if (interior) {
    if (divisions < 2) return { ...segment.a };
    stepIndex = Math.max(1, Math.min(divisions - 1, stepIndex));
  }
  return {
    x: segment.a.x + dx * stepIndex / divisions,
    y: segment.a.y + dy * stepIndex / divisions,
  };
}


function isoGridSegmentId(s) {
  if(!s.segmentId)s.segmentId='pf-'+Date.now().toString(36)+'-'+(++isoGridSegmentSerial);
  return s.segmentId;
}
function isoGridProjectOnSegment(s,p,margin=0) {
  const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,d=dx*dx+dy*dy,len=Math.sqrt(d);
  if(!len||len<margin*2)return null;
  const m=margin?Math.min(.42,margin/len):0;
  const raw=((p.x-s.a.x)*dx+(p.y-s.a.y)*dy)/d;
  const t=Math.max(m,Math.min(1-m,raw));
  return {x:s.a.x+t*dx,y:s.a.y+t*dy,t};
}
function isoGridIsInlineBreak(type){return isoGridBreaksPipe(type)&&!isoGridIsTee(type);}
function isoGridVisiblePipeEnd(p,other,type){
  if(!isoGridIsInlineBreak(type))return p;
  const len=Math.hypot(other.x-p.x,other.y-p.y);
  if(!len)return p;
  const inset=Math.min(.42*len,isoGridIsFlange(type)?8:14);
  return {x:p.x+(other.x-p.x)*inset/len,y:p.y+(other.y-p.y)*inset/len};
}
function isoGridInlineRotation(symbol) {
  if(!symbol.runVector)return symbol.rotation||0;
  const center=symbol.pipePoint||symbol;
  const candidates=isoGridCurrent().segments.filter(seg=>
    Math.hypot(seg.a.x-center.x,seg.a.y-center.y)<.01 ||
    Math.hypot(seg.b.x-center.x,seg.b.y-center.y)<.01);
  const dot=seg=>{
    const dx=seg.b.x-seg.a.x,dy=seg.b.y-seg.a.y;
    return (dx*symbol.runVector.x+dy*symbol.runVector.y)/((Math.hypot(dx,dy)||1)*(Math.hypot(symbol.runVector.x,symbol.runVector.y)||1));
  };
  candidates.sort((a,b)=>dot(b)-dot(a));
  const chosen=candidates[0];
  const a=chosen?isoGridToViewPoint(chosen.a):isoGridToViewPoint(symbol);
  const b=chosen?isoGridToViewPoint(chosen.b):isoGridToViewPoint({x:symbol.x+symbol.runVector.x,y:symbol.y+symbol.runVector.y});
  return Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+(symbol.rotationTrim||0);
}
function isoGridMoveSplitFitting(symbol,point) {
  const old=symbol.pipePoint||symbol,ds=isoGridCurrent().segments;
  const near=p=>Math.hypot(p.x-old.x,p.y-old.y)<.01;
  const touching=ds.filter(s=>near(s.a)||near(s.b));
  let best=null;
  for(let i=0;i<touching.length;i++)for(let j=i+1;j<touching.length;j++){
    const a=near(touching[i].a)?touching[i].b:touching[i].a;
    const b=near(touching[j].a)?touching[j].b:touching[j].a;
    const u={x:a.x-old.x,y:a.y-old.y},v={x:b.x-old.x,y:b.y-old.y};
    const dot=(u.x*v.x+u.y*v.y)/((Math.hypot(u.x,u.y)||1)*(Math.hypot(v.x,v.y)||1));
    if(dot<-.94&&(!best||dot<best.dot))best={a,b,dot};
  }
  if(!best)return false;
  const next=isoGridProjectOnSegment({a:best.a,b:best.b},point,7);
  if(!next)return false;
  isoGridMoveSharedNode(old,next);
  symbol.x=next.x;symbol.y=next.y;symbol.pipePoint={x:next.x,y:next.y};
  return true;
}

function isoGridSegmentInches(section) {
  if(section.measure?.trim()){try{const n=literal(section.measure.trim());if(n>0)return n;}catch{}}
  return section.autoMeasureInches>0?section.autoMeasureInches:isoGridSegmentLength(section);
}
function isoGridOletSegment(symbol) {
  if(symbol?.type!=='OLET'||!symbol.attachedSegmentId)return null;
  return isoGridCurrent().segments.find(s=>s.segmentId===symbol.attachedSegmentId)||null;
}
function isoGridSyncOlets(){
  isoGridCurrent().symbols.forEach(symbol=>{
    const s=isoGridOletSegment(symbol);if(!s)return;
    if(symbol.ccMeasure?.trim()){try{const n=literal(symbol.ccMeasure.trim());const length=isoGridSegmentInches(s);if(n>=0&&length>0)symbol.positionFraction=Math.max(0,Math.min(1,n/length));}catch{}}
    const t=Math.max(0,Math.min(1,Number(symbol.positionFraction)||0));
    symbol.x=s.a.x+(s.b.x-s.a.x)*t;symbol.y=s.a.y+(s.b.y-s.a.y)*t;
    const a=isoGridToViewPoint(s.a),b=isoGridToViewPoint(s.b);
    symbol.rotation=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+(symbol.rotationTrim||0);
  });
}
function isoGridAttachOlet(index,point){
  const drawing=isoGridCurrent(),s=drawing.segments[index],p=s&&isoGridProjectOnSegment(s,point);
  if(!p)return false;
  drawing.symbols.push({x:p.x,y:p.y,type:'OLET',snapped:true,auto:false,
    attachedSegmentId:isoGridSegmentId(s),positionFraction:p.t,ccMeasure:'',rotationTrim:0});
  isoGridSelectedSymbol=drawing.symbols.length-1;isoGridSelectedSegment=-1;
  isoGridSyncOlets();return true;
}
function isoGridOletCToC(symbol){
  const s=isoGridOletSegment(symbol);
  return s?(symbol.ccMeasure?.trim()||fmtFeet(isoGridSegmentInches(s)*(symbol.positionFraction||0))):'';
}
function isoGridOletDimensionMarkup(symbol,index){
  const s=isoGridOletSegment(symbol);if(!s)return '';
  const a=isoGridToViewPoint(s.a),p=isoGridToViewPoint(symbol),b=isoGridToViewPoint(s.b);
  const len=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len,off=37;
  const x1=a.x+nx*off,y1=a.y+ny*off,x2=p.x+nx*off,y2=p.y+ny*off,mx=(x1+x2)/2,my=(y1+y2)/2;
  return '<g data-grid-olet="'+index+'" class="iso-olet-measure"><line x1="'+a.x+'" y1="'+a.y+'" x2="'+x1+'" y2="'+y1+'" class="iso-tap-witness"/><line x1="'+p.x+'" y1="'+p.y+'" x2="'+x2+'" y2="'+y2+'" class="iso-tap-witness"/><line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="iso-tap-dim"/><rect x="'+(mx-48)+'" y="'+(my-11)+'" width="96" height="21" rx="4" class="iso-tap-dim-bg"/><text x="'+mx+'" y="'+(my+3)+'" text-anchor="middle" class="iso-tap-dim-text">'+isoGridEsc('C-C '+isoGridOletCToC(symbol))+'</text></g>';
}
function isoGridQuickEditOletCC(){
  const symbol=isoGridCurrent().symbols[isoGridSelectedSymbol];
  if(symbol?.type!=='OLET'||!isoGridOletSegment(symbol))return;
  isoGridUpdateEditor();
  isoGridSetStatus('Enter C-C from the pipe section start to O-let center, then SAVE SECTION INFO.');
  if(typeof openMeasurePad==='function')openMeasurePad('isoGridMeasure','O-let C-C from section start');
}
function isoGridReturnToLineMode() {
  isoGridMode = 'LINE';
  document.querySelectorAll('[data-iso-stamp]').forEach(item => item.classList.toggle('on', item.dataset.isoStamp === 'LINE'));
}

function isoGridPlaceModeOnSegment(index, event) {
  const drawing = isoGridCurrent();
  const segment = drawing.segments[index];
  if (!segment || isoGridMode === 'LINE') return false;
  const type = isoGridMode;
  const rawPoint = isoGridEventPoint(event, false);
  if (!rawPoint) return false;
  const point = isoGridBreaksPipe(type) || type === 'OLET' ? rawPoint : isoGridSnapPointToSegmentGrid(segment, rawPoint, false, false);
  if (isoGridIsFlange(type)) {
    const nearA = Math.hypot(point.x - segment.a.x, point.y - segment.a.y) < 8;
    const nearB = Math.hypot(point.x - segment.b.x, point.y - segment.b.y) < 8;
    if (nearA || nearB) return isoGridInstallFlangeAtEndpoint(index, nearA ? 'a' : 'b');
  }
  if (isoGridBreaksPipe(type)) {
    if (!isoGridSplitSegmentAt(index, point, type)) {
      isoGridSetStatus('That pipe section is too short to split at an interior grid point. Add another pipe point or choose a longer section.');
      return true;
    }
    isoGridReturnToLineMode();
    isoGridSetStatus(`${isoGridSymbolName(type)} installed on the selected pipe. The line is now two measured sections and PIPE LINE mode is active again.`);
    isoGridRender();
    return true;
  }
  if(type==='OLET'){
    if(!isoGridAttachOlet(index,point))return false;
    isoGridReturnToLineMode();
    isoGridSetStatus('O-let attached on continuous pipe. C-C from start of section.');
    isoGridRender();return true;
  }
  const a=isoGridToViewPoint(segment.a),b=isoGridToViewPoint(segment.b);
  const rotation=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
  drawing.symbols.push({...isoGridProjectOnSegment(segment,point),type,rotation,snapped:true,auto:false});
  isoGridSelectedSymbol = drawing.symbols.length - 1;
  isoGridSelectedSegment = -1;
  isoGridReturnToLineMode();
  isoGridSetStatus(`${isoGridSymbolName(type)} placed on the pipe and aligned with it. PIPE LINE mode is active again.`);
  isoGridRender();
  return true;
}

function isoGridStartBranchAtPoint(index, rawPoint) {
  const drawing = isoGridCurrent();
  const segment = drawing.segments[index];
  if (!segment || isoGridMode !== 'LINE' || !rawPoint) return false;
  const previousLastPoint = isoGridLastPoint ? { ...isoGridLastPoint } : { ...segment.b };
  // Preserve the actual tap position; the tee split routine projects it
  // onto the pipe. Grid-division snapping can collapse short runs to an end.
  const point = rawPoint;
  if (!isoGridSplitSegmentAt(index, point, 'TEE')) {
    isoGridSetStatus('Tap the body of the pipe, away from an endpoint, to install a tee and split the run into two sections.');
    return true;
  }
  const tee = drawing.symbols[isoGridSelectedSymbol];
  if (tee && tee.type === 'TEE') tee.branchRotation = 0;
  if (tee?.splitUndo) tee.splitUndo.lastPoint = previousLastPoint;
  const branchPoint = tee?.pipePoint || point;
  isoGridLastPoint = { ...branchPoint };
  isoGridSetStatus('TEE installed. The original pipe is now two sections at the tee; tap the next grid point to draw the branch as another section.');
  isoGridRender();
  return true;
}

function isoGridStartBranchOnSegment(index, event) {
  const rawPoint = isoGridEventPoint(event, false);
  return isoGridStartBranchAtPoint(index, rawPoint);
}

function isoGridSegmentLength(segment) {
  const gridUnits = Math.hypot(
    (segment.b.x - segment.a.x) / ISO_GRID_STEP,
    (segment.b.y - segment.a.y) / ISO_GRID_STEP,
  );
  return gridUnits * isoGridScaleInches();
}

function isoGridOffsetMath(segment) {
  try {
    const rise = segment?.riseMeasure ? literal(segment.riseMeasure) : NaN;
    const run = segment?.runMeasure ? literal(segment.runMeasure) : NaN;
    if (!(rise > 0) || !(run > 0)) return null;
    return { rise, run, travel: Math.hypot(rise, run), angle: Math.atan2(rise, run) * 180 / Math.PI };
  } catch {
    return null;
  }
}

function isoGridMoveSharedNode(oldPoint, newPoint) {
  const drawing = isoGridCurrent();
  const samePoint = point => Math.hypot(point.x - oldPoint.x, point.y - oldPoint.y) < 0.01;
  drawing.segments.forEach(item => {
    ['a', 'b'].forEach(key => {
      if (samePoint(item[key])) item[key] = { ...newPoint };
    });
  });
  drawing.symbols.forEach(symbol => {
    if ((symbol.auto || symbol.snapped) && Math.hypot(symbol.x - oldPoint.x, symbol.y - oldPoint.y) < 1) {
      symbol.x = newPoint.x;
      symbol.y = newPoint.y;
      if (symbol.pipePoint && samePoint(symbol.pipePoint)) symbol.pipePoint = { ...newPoint };
    }
  });
  if (isoGridLastPoint && samePoint(isoGridLastPoint)) isoGridLastPoint = { ...newPoint };
}

function isoGridUnitVector(vector) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function isoGridOffsetDirectionBasis(segment) {
  const diagonal = Math.SQRT1_2;
  const axes = [
    { name: 'N', vector: { x: -diagonal, y: -diagonal } },
    { name: 'E', vector: { x: diagonal, y: -diagonal } },
    { name: 'S', vector: { x: diagonal, y: diagonal } },
    { name: 'W', vector: { x: -diagonal, y: diagonal } },
  ];
  const verticals = [
    { name: 'UP', vector: { x: 0, y: -1 } },
    { name: 'DOWN', vector: { x: 0, y: 1 } },
  ];
  const savedPlan = axes.find(axis => axis.name === segment.offsetPlanDir);
  const savedVertical = verticals.find(vertical => vertical.name === segment.offsetVerticalDir);
  if (segment.offsetAuto && savedPlan && savedVertical) return { plan: savedPlan, vertical: savedVertical, score: 1 };
  const startView = isoGridToViewPoint(segment.a, 'ISO');
  const endView = isoGridToViewPoint(segment.b, 'ISO');
  const rough = isoGridUnitVector({ x: endView.x - startView.x, y: endView.y - startView.y });
  let plan = axes[0];
  let bestScore = -Infinity;
  axes.forEach(axis => {
    const score = rough.x * axis.vector.x + rough.y * axis.vector.y;
    if (score > bestScore) {
      bestScore = score;
      plan = axis;
    }
  });
  const vertical = rough.y <= 0 ? verticals[0] : verticals[1];
  return { plan, vertical, score: bestScore };
}

function isoGridMeasuredPixelsPerInch(excludeSegment) {
  const drawing = isoGridCurrent();
  const ratios = [];
  drawing.segments.forEach(item => {
    if (!item || item === excludeSegment || item.offsetAuto) return;
    let inches = NaN;
    if (item.measure?.trim()) {
      try { inches = literal(item.measure.trim()); } catch {}
    }
    if (!(inches > 0)) inches = isoGridSegmentLength(item);
    if (!(inches > 0)) return;
    const a = isoGridToViewPoint(item.a, 'ISO');
    const b = isoGridToViewPoint(item.b, 'ISO');
    const pixels = Math.hypot(b.x - a.x, b.y - a.y);
    if (pixels > 1) ratios.push(pixels / inches);
  });
  if (ratios.length) {
    ratios.sort((a, b) => a - b);
    const middle = Math.floor(ratios.length / 2);
    return ratios.length % 2 ? ratios[middle] : (ratios[middle - 1] + ratios[middle]) / 2;
  }
  const matrix = isoGridViewMatrix('ISO');
  const xScale = Math.hypot(matrix.a, matrix.c);
  const yScale = Math.hypot(matrix.b, matrix.d);
  return (ISO_GRID_STEP / isoGridScaleInches()) * ((xScale + yScale) / 2);
}

function isoGridOffsetDisplayGeometry(basis, math, pixelsPerInch) {
  const rawRunPixels = math.run * pixelsPerInch;
  const rawRisePixels = math.rise * pixelsPerInch;
  const rawVector = {
    x: basis.plan.vector.x * rawRunPixels + basis.vertical.vector.x * rawRisePixels,
    y: basis.plan.vector.y * rawRunPixels + basis.vertical.vector.y * rawRisePixels,
  };
  const rawLength = Math.hypot(rawVector.x, rawVector.y) || 1;
  const travelPixels = math.travel * pixelsPerInch;
  const scale = travelPixels / rawLength;
  return {
    runPixels: rawRunPixels * scale,
    risePixels: rawRisePixels * scale,
    vector: { x: rawVector.x * scale, y: rawVector.y * scale },
    travelPixels,
  };
}

function isoGridApplyOffsetGeometry(segment) {
  const math = isoGridOffsetMath(segment);
  if (!math) {
    segment.offsetAuto = false;
    segment.offsetAngleDeg = null;
    segment.offsetPlanDir = null;
    segment.offsetVerticalDir = null;
    return null;
  }
  const startView = isoGridToViewPoint(segment.a, 'ISO');
  const basis = isoGridOffsetDirectionBasis(segment);
  const pixelsPerInch = isoGridMeasuredPixelsPerInch(segment);
  const display = isoGridOffsetDisplayGeometry(basis, math, pixelsPerInch);
  const targetView = {
    x: startView.x + display.vector.x,
    y: startView.y + display.vector.y,
  };
  const oldEnd = { ...segment.b };
  const newEnd = isoGridFromViewPoint(targetView, 'ISO');
  isoGridMoveSharedNode(oldEnd, newEnd);
  segment.b = { ...newEnd };
  segment.measure = fmtFeet(math.travel);
  segment.dimensionType = 'C-C';
  segment.offsetAuto = true;
  segment.offsetAngleDeg = math.angle;
  segment.offsetPlanDir = basis.plan.name;
  segment.offsetVerticalDir = basis.vertical.name;
  segment.offsetPixelsPerInch = pixelsPerInch;
  return { ...math };
}

function isoGridSegmentMeasure(segment) {
  return segment.measure && segment.measure.trim()
    ? segment.measure.trim()
    : fmtFeet(segment.autoMeasureInches > 0 ? segment.autoMeasureInches : isoGridSegmentLength(segment));
}

function isoGridSegmentLabel(segment) {
  const type = ['C-C', 'E-E', 'C-F', 'F-F', 'C-E'].includes(segment.dimensionType) ? segment.dimensionType : 'C-C';
  return type + ' ' + isoGridSegmentMeasure(segment);
}

const ISO_GRID_BREAK_FITTINGS = ['TEE', 'TEE_UP', 'TEE_DOWN', 'CONC_REDUCER', 'ECC_REDUCER', 'UNION', 'FLANGE', 'WN_FLANGE', 'SO_FLANGE', 'SW_FLANGE', 'BLIND_FLANGE', 'GATE', 'GLOBE', 'PLUG', 'BALL', 'CHECK', 'BUTTERFLY', 'NEEDLE', 'STRAINER'];

function isoGridBreaksPipe(type) {
  return ISO_GRID_BREAK_FITTINGS.includes(type);
}

const ISO_GRID_TEE_TYPES = ['TEE', 'TEE_UP', 'TEE_DOWN'];

function isoGridIsTee(type) {
  return ISO_GRID_TEE_TYPES.includes(type);
}

const ISO_GRID_FLANGE_TYPES = ['FLANGE', 'WN_FLANGE', 'SO_FLANGE', 'SW_FLANGE', 'BLIND_FLANGE', 'END_FLANGE'];

function isoGridIsFlange(type) {
  return ISO_GRID_FLANGE_TYPES.includes(type);
}

function isoGridInstallFlangeAtEndpoint(segmentIndex, endpointKey) {
  const drawing = isoGridCurrent();
  const segment = drawing.segments[segmentIndex];
  const point = segment?.[endpointKey];
  if (!segment || !point || !isoGridIsFlange(isoGridMode)) return false;
  const type = isoGridMode;
  const rotation = Math.atan2(segment.b.y - segment.a.y, segment.b.x - segment.a.x) * 180 / Math.PI;
  drawing.symbols.push({ ...point, type, rotation, snapped: true, auto: false, endpointFlange: true });
  isoGridSelectedSymbol = drawing.symbols.length - 1;
  isoGridSelectedSegment = -1;
  isoGridReturnToLineMode();
  isoGridTapGuard = { until: Date.now() + 700 };
  isoGridSetStatus(`${isoGridSymbolName(type)} installed at the pipe endpoint. PIPE LINE mode is active again.`);
  isoGridRender();
  return true;
}

function isoGridTeeRunRotation(symbol) {
  const anchor = symbol.pipePoint || symbol;
  const drawing = isoGridCurrent();
  for (const segment of drawing.segments) {
    const touchesAnchor = (segment.a.x === anchor.x && segment.a.y === anchor.y) || (segment.b.x === anchor.x && segment.b.y === anchor.y);
    if (!touchesAnchor) continue;
    const a = isoGridToViewPoint(segment.a);
    const b = isoGridToViewPoint(segment.b);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (Math.hypot(dx, dy) > 0.5) return Math.atan2(dy, dx) * 180 / Math.PI;
  }
  return isFinite(symbol.rotation) ? symbol.rotation : 0;
}

function isoGridNormalizeAngle(angle) {
  return ((angle + 180) % 360 + 360) % 360 - 180;
}

function isoGridTeeAutoBranchRotation(symbol) {
  const anchor = symbol.pipePoint || symbol;
  const anchorView = isoGridToViewPoint(anchor);
  const runRotation = isoGridTeeRunRotation(symbol);
  let bestAngle = null;
  let bestAxisDelta = 5;
  isoGridCurrent().segments.forEach(segment => {
    const atA = segment.a.x === anchor.x && segment.a.y === anchor.y;
    const atB = segment.b.x === anchor.x && segment.b.y === anchor.y;
    if (!atA && !atB) return;
    const other = atA ? segment.b : segment.a;
    const otherView = isoGridToViewPoint(other);
    const dx = otherView.x - anchorView.x;
    const dy = otherView.y - anchorView.y;
    if (Math.hypot(dx, dy) < 0.5) return;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const fromRun = isoGridNormalizeAngle(angle - runRotation);
    const axisDelta = Math.min(Math.abs(fromRun), Math.abs(180 - Math.abs(fromRun)));
    if (axisDelta > bestAxisDelta) {
      bestAxisDelta = axisDelta;
      bestAngle = angle;
    }
  });
  return bestAngle == null ? null : isoGridNormalizeAngle(bestAngle - runRotation + 90);
}

function isoGridTeeBranchRotation(symbol) {
  const automatic = isoGridTeeAutoBranchRotation(symbol);
  const trim = isFinite(symbol.branchRotation) ? symbol.branchRotation : 0;
  return isoGridNormalizeAngle((automatic == null ? 0 : automatic) + trim);
}

function isoGridSymbolRotationLabel(symbol) {
  if (isoGridIsTee(symbol.type)) {
    const automatic = isoGridTeeAutoBranchRotation(symbol);
    const trim = isFinite(symbol.branchRotation) ? symbol.branchRotation : 0;
    return automatic == null ? `bullhead ${trim.toFixed(0)}°` : `bullhead AUTO • trim ${trim.toFixed(0)}°`;
  }
  return `rotation ${(symbol.rotation || 0).toFixed(0)}°`;
}

function isoGridSyncSpoolLegs() {
  if (typeof isoGridSyncLeg !== 'function') return;
  isoGridCurrent().segments.forEach((segment, index) => {
    isoGridSyncLeg(segment, index, isoGridSegmentMeasure(segment), segment.dimensionType || 'C-C');
  });
}

function isoGridNearestSegment(point, maxDistance = 40) {
  const drawing = isoGridCurrent();
  let best = null;
  drawing.segments.forEach((segment, index) => {
    const dx = segment.b.x - segment.a.x;
    const dy = segment.b.y - segment.a.y;
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return;
    const t = Math.max(0, Math.min(1, ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / lengthSquared));
    const projected = { x: segment.a.x + t * dx, y: segment.a.y + t * dy };
    const distance = Math.hypot(point.x - projected.x, point.y - projected.y);
    if (!best || distance < best.distance) best = { index, point: projected, distance };
  });
  return best && best.distance <= maxDistance ? best : null;
}

function isoGridSplitSegmentAt(index, point, type) {
  const drawing = isoGridCurrent();
  const segment = drawing.segments[index];
  if (!segment) return false;
  // Tees must split even the very first/shortest pipe leg. ISO diagonal
  // screen coordinates often have a GCD of 1, so grid-step splitting fails.
  // Project a tee onto the pipe itself and keep it clear of both endpoints.
  const projected=isoGridProjectOnSegment(segment,point,7);
  if(!projected)return false;
  const split={x:projected.x,y:projected.y};
  if (Math.hypot(split.x - segment.a.x, split.y - segment.a.y) < 6 || Math.hypot(split.x - segment.b.x, split.y - segment.b.y) < 6) return false;
  const firstLength = Math.hypot(split.x - segment.a.x, split.y - segment.a.y);
  const secondLength = Math.hypot(segment.b.x - split.x, segment.b.y - split.y);
  const totalLength = firstLength + secondLength;
  let firstMeasure = '';
  let secondMeasure = '';
  const manualTotal = segment.measure?.trim() ? literal(segment.measure.trim()) : NaN;
  if (isFinite(manualTotal) && manualTotal >= 0 && totalLength > 0) {
    firstMeasure = fmtFeet(manualTotal * firstLength / totalLength);
    secondMeasure = fmtFeet(manualTotal * secondLength / totalLength);
  }
  const undoSegment = { ...segment, a: { ...segment.a }, b: { ...segment.b } };
  const undoLastPoint = isoGridLastPoint ? { ...isoGridLastPoint } : null;
  const autoTotal = segment.autoMeasureInches > 0 ? segment.autoMeasureInches : isoGridSegmentLength(segment);
  const segmentId=isoGridSegmentId(segment);
  const first = { ...segment, b: { ...split }, measure: firstMeasure, autoMeasureInches: autoTotal * firstLength / totalLength, endFitType: type };
  const second = { ...segment, segmentId: null, a: { ...split }, measure: secondMeasure, autoMeasureInches: autoTotal * secondLength / totalLength, note: '', legId: null, startFitType: type };
  first.segmentId=segmentId;
  isoGridSegmentId(second);
  drawing.symbols.forEach(symbol=>{
    if(symbol.type!=='OLET'||symbol.attachedSegmentId!==segmentId)return;
    const t=Math.max(0,Math.min(1,Number(symbol.positionFraction)||0));
    const splitT=firstLength/totalLength;
    if(t>splitT){symbol.attachedSegmentId=second.segmentId;symbol.positionFraction=(t-splitT)/(1-splitT);}
    else symbol.positionFraction=t/splitT;
    symbol.ccMeasure='';
  });
  drawing.segments.splice(index, 1, first, second);
  const rotation = Math.atan2(segment.b.y - segment.a.y, segment.b.x - segment.a.x) * 180 / Math.PI;
   drawing.symbols.push({ ...split, type, rotation, runVector:{x:segment.b.x-segment.a.x,y:segment.b.y-segment.a.y}, rotationTrim:0, snapped: true, auto: false, splitNode: true, pipePoint: { ...split }, manualTotal: isFinite(manualTotal) && manualTotal >= 0 ? manualTotal : null, splitUndo: { index, segment: undoSegment, lastPoint: undoLastPoint } });
  isoGridSelectedSymbol = drawing.symbols.length - 1;
  isoGridSelectedSegment = -1;
  isoGridSyncSpoolLegs();
  return true;
}

function isoGridSymbolName(type) {
  return ({
    ELBOW90: '90 ELBOW',
    ELBOW45: '45 ELBOW',
    TEE: 'TEE',
    TEE_UP: 'TEE LOOKING UP',
    TEE_DOWN: 'TEE LOOKING DOWN',
    STUB_IN: 'STUB-IN',
    OLET: 'OLET',
    CONC_REDUCER: 'CONC REDUCER',
    ECC_REDUCER: 'ECC REDUCER',
    UNION: 'UNION',
    FLANGE: 'FLANGE',
    WN_FLANGE: 'WELD NECK FLANGE',
    SO_FLANGE: 'SLIP-ON FLANGE',
    SW_FLANGE: 'SOCKET WELD FLANGE',
    BLIND_FLANGE: 'BLIND FLANGE',
    END_FLANGE: 'END FLANGE',
    GATE: 'GATE VALVE',
    GLOBE: 'GLOBE VALVE',
    PLUG: 'PLUG VALVE',
    BALL: 'BALL VALVE',
    CHECK: 'CHECK VALVE',
    BUTTERFLY: 'BUTTERFLY VALVE',
    NEEDLE: 'NEEDLE VALVE',
    STRAINER: 'STRAINER',
    CAP: 'CAP',
    FLOW: 'FLOW',
    SLOPE: 'SLOPE',
    LEVEL_REF: 'LEVEL ELEVATION REFERENCE',
    NORTH_ARROW: 'NORTH ARROW',
  })[type] || type;
}

function isoGridVisibleDisplayBounds() {
  const viewport = $('isoTapViewport');
  const scene = $('isoTapScene');
  if (!viewport || !scene) return { left: 0, top: 0, right: ISO_GRID_WIDTH, bottom: ISO_GRID_HEIGHT };
  const rect = scene.getBoundingClientRect();
  const scaleX = rect.width > 0 ? rect.width / ISO_GRID_WIDTH : isoGridZoom;
  const scaleY = rect.height > 0 ? rect.height / ISO_GRID_HEIGHT : isoGridZoom;
  return {
    left: Math.max(0, viewport.scrollLeft / scaleX),
    top: Math.max(0, viewport.scrollTop / scaleY),
    right: Math.min(ISO_GRID_WIDTH, (viewport.scrollLeft + viewport.clientWidth) / scaleX),
    bottom: Math.min(ISO_GRID_HEIGHT, (viewport.scrollTop + viewport.clientHeight) / scaleY),
  };
}

function isoGridEnsureNorthArrow(point = null) {
  const drawing = isoGridCurrent();
  let index = drawing.symbols.findIndex(symbol => symbol.type === 'NORTH_ARROW');
  if (index < 0) {
    const start = isoGridClampPoint(point || { x: 96, y: 96 });
    drawing.symbols.push({ x: start.x, y: start.y, type: 'NORTH_ARROW', rotation: 0, snapped: false, auto: false, annotation: true });
    index = drawing.symbols.length - 1;
  }
  return index;
}

function isoGridSelectNorthArrow() {
  const bounds = isoGridVisibleDisplayBounds();
  const marginX = Math.min(56, Math.max(24, (bounds.right - bounds.left) * 0.18));
  const marginY = Math.min(70, Math.max(42, (bounds.bottom - bounds.top) * 0.16));
  const target = isoGridClampPoint({ x: bounds.right - marginX, y: bounds.top + marginY });
  const drawing = isoGridCurrent();
  const existing = drawing.symbols.findIndex(symbol => symbol.type === 'NORTH_ARROW');
  const index = isoGridEnsureNorthArrow(target);
  const arrow = drawing.symbols[index];
  const visible = arrow.x >= bounds.left + 18 && arrow.x <= bounds.right - 18 && arrow.y >= bounds.top + 42 && arrow.y <= bounds.bottom - 18;
  if (existing < 0 || !visible) {
    arrow.x = target.x;
    arrow.y = target.y;
  }
  isoGridSelectedSymbol = index;
  isoGridSelectedSegment = -1;
  isoGridSetStatus('North arrow selected in the visible drawing area. Drag it anywhere you want, then rotate it to match job north.');
  isoGridRender();
}

function isoGridSymbolMarkup(symbol, index) {
  const viewPoint = symbol.annotation ? isoGridClampPoint(symbol) : isoGridToViewPoint(symbol);
  const x = viewPoint.x;
  const y = viewPoint.y;
  const type = symbol.type;
  const rotation = isFinite(symbol.rotation) ? symbol.rotation : 0;
  const displayRotation = isoGridIsTee(type) ? isoGridTeeRunRotation(symbol) : symbol.splitNode ? isoGridInlineRotation(symbol) : rotation;
  const branchRotation = isoGridIsTee(type) ? isoGridTeeBranchRotation(symbol) : 0;
  const selected = index === isoGridSelectedSymbol;
  const base = 'fill="white" stroke="#111827" stroke-width="2.2" vector-effect="non-scaling-stroke"';
  const line = 'fill="none" stroke="#111827" stroke-width="2.2" vector-effect="non-scaling-stroke"';
  let shape = '';
  if (type === 'ELBOW90') shape = `<path d="M -22 14 H -10 Q 7 14 7 -3 V -22" ${line}/><circle cx="-10" cy="14" r="2.5" fill="#111827"/>`;
  else if (type === 'ELBOW45') shape = `<path d="M -22 12 H -8 L 18 -14" ${line}/><circle cx="-8" cy="12" r="2.5" fill="#111827"/>`;
  else if (type === 'TEE') shape = `<path d="M -24 0 H 24" ${line}/><g transform="rotate(${branchRotation})"><path d="M 0 0 V -23" ${line}/></g><circle cx="0" cy="0" r="2.5" fill="#111827"/>`;
  else if (type === 'TEE_UP') shape = `<path d="M -24 0 H 24" ${line}/><g transform="rotate(${branchRotation})"><path d="M 0 0 V -8" ${line}/><circle cx="0" cy="-16" r="7" ${base}/><circle cx="0" cy="-16" r="2.5" fill="#111827"/></g>`;
  else if (type === 'TEE_DOWN') shape = `<path d="M -24 0 H 24" ${line}/><g transform="rotate(${branchRotation})"><path d="M 0 0 V -8" ${line}/><circle cx="0" cy="-16" r="7" ${base}/><path d="M -4 -20 L 4 -12 M 4 -20 L -4 -12" ${line}/></g>`;
  else if (type === 'STUB_IN') shape = `<path d="M -24 8 L 24 -8 M 0 0 V -23" ${line}/>`;
  else if (type === 'OLET') shape = `<path d="M -24 8 L 24 -8 M 0 0 V -18 M -5 -4 Q 0 -9 5 -4" ${line}/>`;
  else if (type === 'CONC_REDUCER') shape = `<path d="M -24 0 H -8 L 18 -9 M -8 0 L 18 9" ${line}/>`;
  else if (type === 'ECC_REDUCER') shape = `<path d="M -24 0 H -8 L 18 -8 M -8 0 H 18" ${line}/>`;
  else if (type === 'UNION') shape = `<path d="M -24 0 H -8 M -5 -13 V 13 M 3 -13 V 13 M 6 0 H 24" ${line}/>`;
  else if (type === 'END_FLANGE') shape = `<path d="M -5 0 H 5" fill="none" stroke="white" stroke-width="8" vector-effect="non-scaling-stroke"/><path d="M 0 -15 V 15" ${line}/>`;
  else if (['FLANGE', 'WN_FLANGE', 'SO_FLANGE', 'SW_FLANGE', 'BLIND_FLANGE'].includes(type)) shape = `<path d="M -8 0 H 8" fill="none" stroke="white" stroke-width="8" vector-effect="non-scaling-stroke"/><path d="M -4 -15 V 15 M 4 -15 V 15" ${line}/>`;
  else if (type === 'GATE') shape = `<path d="M -27 0 H -14 L 0 -11 L 14 0 L 0 11 L -14 0 H 27" ${line}/>`;
  else if (type === 'GLOBE') shape = `<path d="M -27 0 H -14 L 0 -10 L 14 0 L 0 10 L -14 0 H 27" ${line}/><circle cx="0" cy="0" r="4" fill="#111827"/>`;
  else if (type === 'PLUG') shape = `<path d="M -27 0 H -14 L 0 -10 L 14 0 L 0 10 L -14 0 H 27" ${line}/><path d="M -4 -5 L 4 5" ${line}/>`;
  else if (type === 'BALL') shape = `<path d="M -27 0 H -14 M 14 0 H 27" ${line}/><circle cx="0" cy="0" r="13" ${base}/><circle cx="0" cy="0" r="4" fill="#111827"/>`;
  else if (type === 'CHECK') shape = `<path d="M -27 0 H -15 L 7 -12 V 12 Z M 12 -13 V 13 M 12 0 H 27" ${line}/>`;
  else if (type === 'BUTTERFLY') shape = `<path d="M -27 0 H -12 M 12 0 H 27 M -12 -10 L 12 10 M -12 10 L 12 -10" ${line}/>`;
  else if (type === 'NEEDLE') shape = `<path d="M -27 0 H -14 L 0 -10 L 14 0 L 0 10 L -14 0 H 27 M 0 -16 V 16" ${line}/>`;
  else if (type === 'STRAINER') shape = `<path d="M -27 0 H -11 L 4 -11 L 17 0 L 4 11 L -11 0 H 27 M -2 -9 L 7 8" ${line}/>`;
  else if (type === 'CAP') shape = `<path d="M -23 0 H 0 M 0 -15 Q 12 0 0 15" ${line}/>`;
  else if (type === 'FLOW') shape = `<path d="M -27 0 H 24 M 8 -10 L 24 0 L 8 10 Z" ${line}/>`;
  else if (type === 'SLOPE') shape = `<path d="M -27 9 L 27 -9 M -7 -2 L 8 -2 L -1 6 Z" ${line}/>`;
  else if (type === 'LEVEL_REF') shape = `<path d="M -27 10 L 27 -10 M 0 0 V 20 M 0 20 L -9 9" ${line}/>`;
  else if (type === 'NORTH_ARROW') shape = `<path d="M 0 30 V -18 M -9 -7 L 0 -29 L 9 -7 Z" fill="white" stroke="#0f172a" stroke-width="2.4" vector-effect="non-scaling-stroke"/><text x="0" y="-38" text-anchor="middle" fill="#0f172a" font-size="18" font-weight="900">N</text>`;
  const selectedRing = selected
    ? '<circle cx="0" cy="0" r="30" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>'
    : '';
  return `<g transform="translate(${x} ${y}) rotate(${displayRotation})" data-grid-symbol="${index}" class="iso-grid-symbol">${shape}${selectedRing}</g>`;
}

function isoGridNodeList() {
  const nodes = [];
  isoGridCurrent().segments.forEach(segment => {
    [segment.a, segment.b].forEach(point => {
      if (!nodes.some(node => node.x === point.x && node.y === point.y)) nodes.push({ x: point.x, y: point.y });
    });
  });
  return nodes;
}

function isoGridNearestNode(point, maxDistance = ISO_GRID_NODE_SNAP) {
  let best = null;
  let bestDistance = Infinity;
  isoGridNodeList().forEach(node => {
    const distance = Math.hypot(node.x - point.x, node.y - point.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = node;
    }
  });
  return best && bestDistance <= maxDistance ? { ...best, distance: bestDistance } : null;
}

function isoGridUpdateEditor() {
  const info = $('isoGridSelectionInfo');
  const dimensionType = $('isoGridDimensionType');
  const measure = $('isoGridMeasure');
  const riseMeasure = $('isoGridRiseMeasure');
  const runMeasure = $('isoGridRunMeasure');
  const note = $('isoGridNote');
  const drawing = isoGridCurrent();
  const segment = drawing.segments[isoGridSelectedSegment];
  const symbol = drawing.symbols[isoGridSelectedSymbol];
  if (segment) {
    if (info) {
      const offsetMath = isoGridOffsetMath(segment);
      info.innerHTML = offsetMath && segment.offsetAuto
        ? `<b>Selected pipe S${isoGridSelectedSegment + 1}</b> • OFFSET ${offsetMath.angle.toFixed(1)}° • travel ${isoGridEsc(fmtFeet(offsetMath.travel))}${segment.complete ? ' • COMPLETE' : ''}`
        : `<b>Selected pipe S${isoGridSelectedSegment + 1}</b> • auto ${isoGridEsc(fmtFeet(isoGridSegmentLength(segment)))}${segment.complete ? ' • COMPLETE' : ''}`;
    }
    if (dimensionType) dimensionType.value = segment.dimensionType || 'C-C';
    if (measure) measure.value = segment.measure || '';
    if (riseMeasure) riseMeasure.value = segment.riseMeasure || '';
    if (runMeasure) runMeasure.value = segment.runMeasure || '';
    if (note) note.value = segment.note || '';
    return;
  }
  if(symbol?.type==='OLET'&&isoGridOletSegment(symbol)){
    if(info)info.innerHTML='<b>O-let</b> • C-C from start of the continuous pipe section. Enter C-C then SAVE SECTION INFO.';
    if(dimensionType)dimensionType.value='C-C';
    if(measure)measure.value=isoGridOletCToC(symbol);
    if(riseMeasure)riseMeasure.value='';
    if(runMeasure)runMeasure.value='';
    if(note)note.value='';
    return;
  }
  if (symbol) {
    if (info) info.innerHTML = `<b>Selected fitting:</b> ${isoGridEsc(isoGridSymbolName(symbol.type))} • ${isoGridSymbolRotationLabel(symbol)}`;
    if (dimensionType) dimensionType.value = 'C-C';
    if (measure) measure.value = '';
    if (riseMeasure) riseMeasure.value = '';
    if (runMeasure) runMeasure.value = '';
    if (note) note.value = '';
    return;
  }
  if (info) info.textContent = 'Tap a pipe section to highlight it, or tap a blue fitting symbol to move / rotate it.';
  if (dimensionType) dimensionType.value = 'C-C';
  if (measure) measure.value = '';
  if (offsetType) offsetType.value = '';
  if (offsetMeasure) offsetMeasure.value = '';
  if (note) note.value = ''; 
}

function isoGridUpdateQuickBar() {
  const bar = $('isoDrawingQuickBar');
  if (!bar) return;
  const drawing = isoGridCurrent();
  const segment = drawing.segments[isoGridSelectedSegment];
  const symbol = drawing.symbols[isoGridSelectedSymbol];
  const pipeControls = $('isoQuickPipeControls');
  const fittingControls = $('isoQuickFittingControls');
  const title = $('isoQuickTitle');
  const hint = $('isoQuickHint');
  const quickType = $('isoQuickDimensionType');
  const measureButton = $('isoQuickMeasureButton');
  const riseButton = $('isoQuickRiseButton');
  const runButton = $('isoQuickRunButton');
  const snapButton = $('isoQuickSnapButton');
  const oletButton = $('isoQuickOletCC');
  if (!segment && !symbol) {
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  if (segment) {
    oletButton?.classList.add('hidden');
    pipeControls?.classList.remove('hidden');
    fittingControls?.classList.add('hidden');
    if (title) title.textContent = `PIPE S${isoGridSelectedSegment + 1} • ${segment.dimensionType || 'C-C'}`;
    const offsetMath = isoGridOffsetMath(segment);
    if (hint) hint.textContent = offsetMath && segment.offsetAuto ? `AUTO OFFSET ${offsetMath.angle.toFixed(1)}° • travel ${fmtFeet(offsetMath.travel)} — visual length stays proportional to the rest of the measured pipe.` : 'Rough in the offset direction, then enter RISE and RUN. The offset will move onto the in-between ISO plane without adding a compass-direction label.';
    if (quickType) quickType.value = segment.dimensionType || 'C-C';
    if (measureButton) measureButton.textContent = offsetMath && segment.offsetAuto ? `AUTO TRAVEL: ${fmtFeet(offsetMath.travel)}` : `TRAVEL: ${isoGridSegmentMeasure(segment)}`;
    if (riseButton) riseButton.textContent = `RISE: ${segment.riseMeasure || 'SET'}`;
    if (runButton) runButton.textContent = `RUN: ${segment.runMeasure || 'SET'}`;
    return;
  }
  pipeControls?.classList.add('hidden');
  fittingControls?.classList.remove('hidden');
  oletButton?.classList.toggle('hidden', symbol.type!=='OLET'||!isoGridOletSegment(symbol));
  if (title) title.textContent = `${isoGridSymbolName(symbol.type)} • ${isoGridSymbolRotationLabel(symbol)}`;
  if (symbol.type === 'NORTH_ARROW') {
    if (hint) hint.textContent = 'Drag the north arrow to position it, then rotate it to match job north.';
    snapButton?.classList.add('hidden');
  } else if (isoGridIsTee(symbol.type)) {
    if (hint) hint.textContent = 'Rotate changes only the tee bullhead / branch. The straight-through run stays aligned with the pipe.';
    snapButton?.classList.remove('hidden');
  } else {
    if(hint)hint.textContent=symbol.type==='OLET'?'O-let on continuous pipe. Edit C-C in Selected Fitting and SAVE SECTION INFO.':symbol.splitNode?'Drag along the pipe to move this fitting junction, or edit the adjoining C-C sections.':'Drag to move; a preview shows the position beside your finger.';
    snapButton?.classList.remove('hidden');
  }
}

function isoGridQuickDimensionTypeChanged(value) {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) return;
  segment.dimensionType = ['C-C', 'E-E', 'C-F', 'F-F', 'C-E'].includes(value) ? value : 'C-C';
  isoGridSyncSpoolLegs();
  isoGridSetStatus(`Section S${isoGridSelectedSegment + 1} dimension changed to ${segment.dimensionType}. No scrolling needed.`);
  isoGridRender();
}

function isoGridQuickEditRiseMeasurement() {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) return;
  isoGridUpdateEditor();
  isoGridSetStatus(`Enter the vertical RISE for pipe S${isoGridSelectedSegment + 1}.`);
  if (typeof openMeasurePad === 'function') openMeasurePad('isoGridRiseMeasure', `RISE for pipe S${isoGridSelectedSegment + 1}`);
}

function isoGridQuickEditRunMeasurement() {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) return;
  isoGridUpdateEditor();
  isoGridSetStatus(`Enter the horizontal RUN for pipe S${isoGridSelectedSegment + 1}.`);
  if (typeof openMeasurePad === 'function') openMeasurePad('isoGridRunMeasure', `RUN for pipe S${isoGridSelectedSegment + 1}`);
}

function isoGridQuickEditMeasurement() {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) {
    isoGridSetStatus('Tap a pipe section first.');
    return;
  }
  isoGridUpdateEditor();
  if (typeof openMeasurePad === 'function') openMeasurePad('isoGridMeasure', `Pipe S${isoGridSelectedSegment + 1}`);
}

function isoGridAdjustMeasurementSize(delta) {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) return;
  const current = Number(segment.measurementScale) || 1;
  segment.measurementScale = Math.max(0.6, Math.min(1.4, Math.round((current + delta) * 10) / 10));
  isoGridSetStatus(`Measurement text for S${isoGridSelectedSegment + 1} is ${Math.round(segment.measurementScale * 100)}%. Drag any visible measurement label to move it.`);
  isoGridRender();
}

function isoGridResetMeasurementLayout() {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) return;
  segment.measurementScale = 1;
  segment.measureLabelOffset = { x: 0, y: 0 };
  segment.riseLabelOffset = { x: 0, y: 0 };
  segment.runLabelOffset = { x: 0, y: 0 };
  isoGridSetStatus(`Measurement layout for S${isoGridSelectedSegment + 1} reset. Drag a label to reposition it or use DIM − / DIM + to resize.`);
  isoGridRender();
}

function isoGridFlipMeasurementSide() {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) return;
  const a = segment.a?.isoDisplayPoint && isoGridView === 'ISO' ? segment.a.isoDisplayPoint : isoGridToViewPoint(segment.a);
  const b = segment.b?.isoDisplayPoint && isoGridView === 'ISO' ? segment.b.isoDisplayPoint : isoGridToViewPoint(segment.b);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const autoSide = (nx * (midX - ISO_GRID_WIDTH / 2) + ny * (midY - ISO_GRID_HEIGHT / 2)) >= 0 ? 1 : -1;
  const currentSide = segment.dimensionSide === 1 || segment.dimensionSide === -1 ? segment.dimensionSide : autoSide;
  segment.dimensionSide = -currentSide;
  segment.measureLabelOffset = { x: 0, y: 0 };
  isoGridSetStatus(`Dimension for S${isoGridSelectedSegment + 1} flipped to the opposite side of the pipe.`);
  isoGridRender();
}

function isoGridToggleMeasurementRotation() {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) return;
  segment.measurementRotationMode = segment.measurementRotationMode === 'HORIZONTAL' ? 'AUTO' : 'HORIZONTAL';
  isoGridSetStatus(segment.measurementRotationMode === 'HORIZONTAL'
    ? `Dimension for S${isoGridSelectedSegment + 1} is horizontal for easy reading.`
    : `Dimension for S${isoGridSelectedSegment + 1} follows the pipe angle and stays upright.`);
  isoGridRender();
}

// Both witness lines stay attached to the pipe; the dimension and label move together.
function isoGridDimensionMarkup(index, kind, anchorA, anchorB, baseA, baseB, offset, text, scale, angle = 0) {
  const a = { x: baseA.x + offset.x, y: baseA.y + offset.y };
  const b = { x: baseB.x + offset.x, y: baseB.y + offset.y };
  const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
  const main = kind === 'measure';
  const width = (main ? 94 : 62) * scale;
  const height = (main ? 15 : 18) * scale;
  return `<g data-dimension="${kind}" data-dimension-section="${index}"><line x1="${anchorA.x}" y1="${anchorA.y}" x2="${a.x}" y2="${a.y}" class="iso-tap-witness"/><line x1="${anchorB.x}" y1="${anchorB.y}" x2="${b.x}" y2="${b.y}" class="iso-tap-witness"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="iso-tap-dim" marker-start="url(#isoDimArrow)" marker-end="url(#isoDimArrow)"/><g data-dimension-label><g transform="rotate(${angle} ${x} ${y})"><rect x="${x - width / 2}" y="${y - (main ? 9 : 10) * scale}" width="${width}" height="${height}" rx="${3 * scale}" class="iso-tap-dim-bg iso-movable-measure" data-grid-${kind}="${index}"/><text x="${x}" y="${y + (main ? 1 : 2) * scale}" class="iso-tap-dim-text iso-movable-measure" data-grid-${kind}="${index}" style="font-size:${(main ? 9 : 10) * scale}px">${isoGridEsc(text)}</text></g></g></g>`;
}

function isoGridRender() {
  const scene = $('isoTapScene');
  const svg = $('isoTapSvg');
  if (!scene || !svg) return;
  isoGridApplyDisplayState();
  const width = ISO_GRID_WIDTH * isoGridZoom;
  const height = ISO_GRID_HEIGHT * isoGridZoom;
  scene.style.width = `${width}px`;
  scene.style.height = `${height}px`;
  const gridOverlay = scene.querySelector('.iso-photo-grid-overlay');
  if (gridOverlay) {
    gridOverlay.classList.toggle('is-iso', isoGridView === 'ISO');
    if (isoGridView !== 'ISO') {
      const major = 120 * isoGridZoom;
      const minor = ISO_GRID_STEP * isoGridZoom;
      gridOverlay.style.backgroundSize = `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`;
      gridOverlay.style.backgroundPosition = '0 0, 0 0, 0 0, 0 0';
    } else {
      gridOverlay.style.backgroundImage = 'none';
    }
  }
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  const drawing = isoGridCurrent();
  isoGridSyncOlets();
  const occupiedDimensionLabels = [];
    let markup = '<defs><marker id="isoDimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#1e3a8a"/></marker></defs>';
    if (isoGridView === 'ISO' && isoGridVisible) {
      const vStep = ISO_GRID_STEP / Math.cos(Math.PI / 6);
      let gridMarkup = '<g class="iso-exact-grid">';
      for (let x = 0; x <= ISO_GRID_WIDTH; x += ISO_GRID_STEP) gridMarkup += `<line x1="${x}" y1="0" x2="${x}" y2="${ISO_GRID_HEIGHT}"/>`;
      for (let k = -Math.ceil(ISO_GRID_HEIGHT / vStep) - Math.ceil(ISO_GRID_WIDTH / ISO_GRID_STEP); k <= Math.ceil(ISO_GRID_HEIGHT / vStep) + Math.ceil(ISO_GRID_WIDTH / ISO_GRID_STEP); k += 1) {
        const y0 = k * vStep;
        gridMarkup += `<line x1="0" y1="${y0}" x2="${ISO_GRID_WIDTH}" y2="${y0 + ISO_GRID_WIDTH * Math.tan(Math.PI / 6)}"/>`;
        gridMarkup += `<line x1="0" y1="${y0}" x2="${ISO_GRID_WIDTH}" y2="${y0 - ISO_GRID_WIDTH * Math.tan(Math.PI / 6)}"/>`;
      }
      markup += gridMarkup + '</g>';
    }
    drawing.segments.forEach((segment, index) => {
    const a = segment.a?.isoDisplayPoint && isoGridView === 'ISO' ? segment.a.isoDisplayPoint : isoGridToViewPoint(segment.a);
    const b = segment.b?.isoDisplayPoint && isoGridView === 'ISO' ? segment.b.isoDisplayPoint : isoGridToViewPoint(segment.b);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const pipeMidX = (a.x + b.x) / 2;
    const pipeMidY = (a.y + b.y) / 2;
    const autoDimensionSide = (nx * (pipeMidX - ISO_GRID_WIDTH / 2) + ny * (pipeMidY - ISO_GRID_HEIGHT / 2)) >= 0 ? 1 : -1;
    let dimensionSide = segment.dimensionSide === 1 || segment.dimensionSide === -1 ? segment.dimensionSide : autoDimensionSide;
    let offset = 28;
    let dimensionTextAngle = Math.atan2(dy, dx) * 180 / Math.PI;
    while (dimensionTextAngle > 90) dimensionTextAngle -= 180;
    while (dimensionTextAngle < -90) dimensionTextAngle += 180;
    if (segment.measurementRotationMode === 'HORIZONTAL') dimensionTextAngle = 0;
    const dimension = isoGridSegmentLabel(segment);
    const measurementScale = 0.85 * Math.max(0.6, Math.min(1.4, Number(segment.measurementScale) || 1));
    const measureLabelOffset = segment.measureLabelOffset || { x: 0, y: 0 };
    const visibleDimension = isoGridMeasurementMode === 'ALL' || (isoGridMeasurementMode === 'AUTO' && index === isoGridSelectedSegment);
    // Place automatic dimension lanes clear of other labels and pipe runs.
    // Keep user-dragged labels exactly where the user left them.
    const explicitOffset = Math.hypot(measureLabelOffset.x, measureLabelOffset.y) > 1;
    const angleRad = dimensionTextAngle * Math.PI / 180;
    const halfW = Math.abs(Math.cos(angleRad)) * 47 * measurementScale + Math.abs(Math.sin(angleRad)) * 10 * measurementScale + 8;
    const halfH = Math.abs(Math.sin(angleRad)) * 47 * measurementScale + Math.abs(Math.cos(angleRad)) * 10 * measurementScale + 8;
    const candidateSides = segment.dimensionSide === 1 || segment.dimensionSide === -1 ? [dimensionSide] : [dimensionSide, -dimensionSide];
    const collidesWithPipe = (cx, cy) => drawing.segments.some((other, otherIndex) => {
      if (otherIndex === index) return false;
      const oa = isoGridToViewPoint(other.a);
      const ob = isoGridToViewPoint(other.b);
      const vx = ob.x - oa.x;
      const vy = ob.y - oa.y;
      const lengthSquared = vx * vx + vy * vy;
      if (!lengthSquared) return false;
      const t = Math.max(0, Math.min(1, ((cx - oa.x) * vx + (cy - oa.y) * vy) / lengthSquared));
      return Math.hypot(cx - (oa.x + t * vx), cy - (oa.y + t * vy)) < Math.min(halfW, halfH) + 9;
    });
    if (visibleDimension && !explicitOffset) {
      let chosen = null;
      for (const lane of [28, 54, 80, 106, 132, 158]) {
        for (const side of candidateSides) {
          const cx = pipeMidX + nx * lane * side;
          const cy = pipeMidY + ny * lane * side;
          const box = { x1: cx - halfW, x2: cx + halfW, y1: cy - halfH, y2: cy + halfH };
          const inBounds = box.x1 > 8 && box.x2 < ISO_GRID_WIDTH - 8 && box.y1 > 8 && box.y2 < ISO_GRID_HEIGHT - 8;
          const overlaps = occupiedDimensionLabels.some(used => box.x1 < used.x2 + 8 && box.x2 + 8 > used.x1 && box.y1 < used.y2 + 8 && box.y2 + 8 > used.y1);
          if (inBounds && !overlaps && !collidesWithPipe(cx, cy)) { chosen = { lane, side, box }; break; }
        }
        if (chosen) break;
      }
      if (chosen) { offset = chosen.lane; dimensionSide = chosen.side; }
    }
    const d1 = { x: a.x + nx * offset * dimensionSide, y: a.y + ny * offset * dimensionSide };
    const d2 = { x: b.x + nx * offset * dimensionSide, y: b.y + ny * offset * dimensionSide };
    const mx = (d1.x + d2.x) / 2;
    const my = (d1.y + d2.y) / 2;
    if (visibleDimension) occupiedDimensionLabels.push({
      x1: mx + measureLabelOffset.x - halfW,
      x2: mx + measureLabelOffset.x + halfW,
      y1: my + measureLabelOffset.y - halfH,
      y2: my + measureLabelOffset.y + halfH,
    });
    const riseLabelOffset = segment.riseLabelOffset || { x: 0, y: 0 };
    const runLabelOffset = segment.runLabelOffset || { x: 0, y: 0 };
    const pipeClass = index === isoGridSelectedSegment
      ? 'iso-tap-pipe selected'
      : segment.complete
        ? 'iso-tap-pipe complete'
        : 'iso-tap-pipe';
    const showSegmentMeasurements = isoGridMeasurementMode === 'ALL' || (isoGridMeasurementMode === 'AUTO' && index === isoGridSelectedSegment);
    const dimensionMarkup = showSegmentMeasurements ? isoGridDimensionMarkup(index, 'measure', a, b, d1, d2, measureLabelOffset, dimension, measurementScale, dimensionTextAngle) : '';
    const leftX = Math.max(26, Math.min(a.x, b.x) - 34); const topY = Math.min(a.y, b.y); const bottomY = Math.max(a.y, b.y); const midY = (topY + bottomY) / 2; const leftEnd = a.x <= b.x ? a : b; const rightEnd = a.x <= b.x ? b : a; const runY = Math.min(ISO_GRID_HEIGHT - 28, Math.max(a.y, b.y) + 34); const runMidX = (leftEnd.x + rightEnd.x) / 2;
    const offsetMath = isoGridOffsetMath(segment);
    let offsetGuideMarkup = '';
    let riseMarkup = showSegmentMeasurements && segment.riseMeasure ? isoGridDimensionMarkup(index, 'rise', a.y <= b.y ? a : b, a.y <= b.y ? b : a, {x:leftX,y:topY}, {x:leftX,y:bottomY}, riseLabelOffset, segment.riseMeasure, measurementScale) : '';
    let runMarkup = showSegmentMeasurements && segment.runMeasure ? isoGridDimensionMarkup(index, 'run', leftEnd, rightEnd, {x:leftEnd.x,y:runY}, {x:rightEnd.x,y:runY}, runLabelOffset, segment.runMeasure, measurementScale) : '';
    if (isoGridView === 'ISO' && offsetMath && segment.offsetAuto && (isoGridMeasurementMode === 'ALL' || index === isoGridSelectedSegment)) {
      const basis = isoGridOffsetDirectionBasis(segment);
      const pixelsPerInch = Number(segment.offsetPixelsPerInch) > 0 ? Number(segment.offsetPixelsPerInch) : isoGridMeasuredPixelsPerInch(segment);
      const display = isoGridOffsetDisplayGeometry(basis, offsetMath, pixelsPerInch);
      const runPixels = display.runPixels;
      const risePixels = display.risePixels;
      const corner = { x: a.x + basis.plan.vector.x * runPixels, y: a.y + basis.plan.vector.y * runPixels };
      let hatches = '';
      for (let hatchIndex = 1; hatchIndex <= 6; hatchIndex += 1) {
        const t = hatchIndex / 7;
        const base = { x: a.x + basis.plan.vector.x * runPixels * t, y: a.y + basis.plan.vector.y * runPixels * t };
        const travel = { x: a.x + (basis.plan.vector.x * runPixels + basis.vertical.vector.x * risePixels) * t, y: a.y + (basis.plan.vector.y * runPixels + basis.vertical.vector.y * risePixels) * t };
        hatches += `<line x1="${base.x}" y1="${base.y}" x2="${travel.x}" y2="${travel.y}" class="iso-offset-hatch"/>`;
      }
      const angleText = Number(offsetMath.angle.toFixed(1));
      offsetGuideMarkup = `<g class="iso-offset-plane"><line x1="${a.x}" y1="${a.y}" x2="${corner.x}" y2="${corner.y}" class="iso-offset-guide" marker-end="url(#isoDimArrow)"/><line x1="${corner.x}" y1="${corner.y}" x2="${b.x}" y2="${b.y}" class="iso-offset-guide"/>${hatches}<text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 16}" class="iso-offset-angle-text">${angleText}° OFFSET</text></g>`;
      if (showSegmentMeasurements) {
        const runNormal = { x: -basis.plan.vector.y, y: basis.plan.vector.x };
        const runShift = 24;
        const runA = { x: a.x + runNormal.x * runShift, y: a.y + runNormal.y * runShift };
        const runB = { x: corner.x + runNormal.x * runShift, y: corner.y + runNormal.y * runShift };
        const runMid = { x: (runA.x + runB.x) / 2, y: (runA.y + runB.y) / 2 };
        runMarkup = segment.runMeasure ? isoGridDimensionMarkup(index, 'run', a, corner, runA, runB, runLabelOffset, segment.runMeasure, measurementScale) : '';
        const riseNormal = { x: -basis.vertical.vector.y, y: basis.vertical.vector.x };
        const riseShift = 28 * (basis.plan.vector.x >= 0 ? 1 : -1);
        const riseA = { x: corner.x + riseNormal.x * riseShift, y: corner.y + riseNormal.y * riseShift };
        const riseB = { x: b.x + riseNormal.x * riseShift, y: b.y + riseNormal.y * riseShift };
        const riseMid = { x: (riseA.x + riseB.x) / 2, y: (riseA.y + riseB.y) / 2 };
        riseMarkup = segment.riseMeasure ? isoGridDimensionMarkup(index, 'rise', corner, b, riseA, riseB, riseLabelOffset, segment.riseMeasure, measurementScale) : '';
      }
    }
    const drawA=isoGridVisiblePipeEnd(a,b,segment.startFitType);
    const drawB=isoGridVisiblePipeEnd(b,a,segment.endFitType);
    markup += `<g data-grid-segment="${index}" class="iso-grid-segment"><line x1="${drawA.x}" y1="${drawA.y}" x2="${drawB.x}" y2="${drawB.y}" class="${pipeClass}"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="iso-tap-hit"/><circle cx="${a.x}" cy="${a.y}" r="7" class="iso-tap-node iso-end-touch" data-grid-end="a" data-grid-segment="${index}"/><circle cx="${b.x}" cy="${b.y}" r="7" class="iso-tap-node iso-end-touch" data-grid-end="b" data-grid-segment="${index}"/>${dimensionMarkup}${offsetGuideMarkup}${riseMarkup}${runMarkup}${segment.note ? `<text x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 + 18}" class="iso-tap-note">${isoGridEsc(segment.note)}</text>` : ''}</g>`;
    if (index === isoGridSelectedSegment) {
      markup += `<circle cx="${a.x}" cy="${a.y}" r="14" class="iso-end-handle" data-grid-end="a" data-grid-segment="${index}"/><circle cx="${b.x}" cy="${b.y}" r="14" class="iso-end-handle" data-grid-end="b" data-grid-segment="${index}"/>`; 
    }
  });
  drawing.symbols.forEach((symbol,index)=>{
    if(symbol.type==='OLET'&&isoGridMeasurementMode!=='OFF')markup+=isoGridOletDimensionMarkup(symbol,index);
    markup+=isoGridSymbolMarkup(symbol,index);
  });
  if (isoGridLastPoint) {
    const currentViewPoint = isoGridLastPoint?.isoDisplayPoint && isoGridView === 'ISO' ? isoGridLastPoint.isoDisplayPoint : isoGridToViewPoint(isoGridLastPoint);
    markup += `<circle cx="${currentViewPoint.x}" cy="${currentViewPoint.y}" r="8" class="iso-tap-current"/>`;
  }
  svg.innerHTML = markup;
  const firstRunCapture = $('isoFirstRunCapture');
  if (firstRunCapture) firstRunCapture.classList.toggle('active', isoGridMode === 'LINE' && drawing.segments.length === 0);
  svg.querySelectorAll('[data-grid-measure]').forEach(element => {
    element.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation(); if (Date.now() < isoGridMeasurementDragUntil) return; const index = +element.dataset.gridMeasure; isoGridSelectSegment(index); setTimeout(isoGridQuickEditMeasurement, 0);
    });
  });
  svg.querySelectorAll('[data-grid-rise]').forEach(element => { element.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); if (Date.now() < isoGridMeasurementDragUntil) return; const index = +element.dataset.gridRise; isoGridSelectSegment(index); setTimeout(isoGridQuickEditRiseMeasurement, 0); }); });
  svg.querySelectorAll('[data-grid-run]').forEach(element => { element.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); if (Date.now() < isoGridMeasurementDragUntil) return; const index = +element.dataset.gridRun; isoGridSelectSegment(index); setTimeout(isoGridQuickEditRunMeasurement, 0); }); });
  const bindMeasurementDrag = (selector, datasetKey, offsetKey) => {
    svg.querySelectorAll(selector).forEach(element => {
      const beginDrag = (startX, startY, moveTarget, moveName, endName, cancelName, matchEvent, pointFromEvent) => {
        const index = +element.dataset[datasetKey];
        const segment = drawing.segments[index];
        if (!segment) return;
        const original = segment[offsetKey] || { x: 0, y: 0 };
        let dragging = false;
        const callout = element.closest('[data-dimension]');
        const label = callout?.querySelector('[data-dimension-label]');
        const lines = Array.from(callout?.querySelectorAll('line') || []).map(line => ({
          line, witness: line.classList.contains('iso-tap-witness'),
          x1: +line.getAttribute('x1'), y1: +line.getAttribute('y1'),
          x2: +line.getAttribute('x2'), y2: +line.getAttribute('y2'),
        }));
        const preview = (dx, dy) => {
          if (label) label.setAttribute('transform', `translate(${dx} ${dy})`);
          lines.forEach(item => {
            if (!item.witness) {
              item.line.setAttribute('x1', item.x1 + dx);
              item.line.setAttribute('y1', item.y1 + dy);
            }
            item.line.setAttribute('x2', item.x2 + dx);
            item.line.setAttribute('y2', item.y2 + dy);
          });
        };
        const move = moveEvent => {
          const point = pointFromEvent(moveEvent);
          if (!point || !matchEvent(moveEvent)) return;
          const dx = (point.clientX - startX) / isoGridZoom;
          const dy = (point.clientY - startY) / isoGridZoom;
          if (!dragging && Math.hypot(dx, dy) < 5) return;
          dragging = true;
          preview(dx, dy);
          isoGridMeasurementDragUntil = Date.now() + 800;
          isoGridPanSuppressUntil = Date.now() + 800;
          moveEvent.preventDefault();
          moveEvent.stopPropagation();
        };
        const finish = endEvent => {
          const point = pointFromEvent(endEvent);
          if (!point || !matchEvent(endEvent)) return;
          cleanup();
          if (!dragging) return;
          const dx = (point.clientX - startX) / isoGridZoom;
          const dy = (point.clientY - startY) / isoGridZoom;
          segment[offsetKey] = { x: original.x + dx, y: original.y + dy };
          isoGridMeasurementDragUntil = Date.now() + 800;
          isoGridPanSuppressUntil = Date.now() + 800;
          isoGridTapGuard = { until: Date.now() + 800 };
          isoGridSelectedSegment = index;
          isoGridSelectedSymbol = -1;
          isoGridSetStatus(`Measurement moved for S${index + 1}. Drag it anytime; FLIP DIM changes sides and ROTATE DIM changes text orientation.`);
          isoGridRender();
          endEvent.preventDefault();
          endEvent.stopPropagation();
        };
        const cancel = cancelEvent => {
          if (!matchEvent(cancelEvent)) return;
          cleanup();
          preview(0, 0);
        };
        const cleanup = () => {
          moveTarget.removeEventListener(moveName, move);
          moveTarget.removeEventListener(endName, finish);
          moveTarget.removeEventListener(cancelName, cancel);
        };
        moveTarget.addEventListener(moveName, move, { passive: false });
        moveTarget.addEventListener(endName, finish, { passive: false });
        moveTarget.addEventListener(cancelName, cancel, { passive: false });
      };

      element.addEventListener('touchstart', event => {
        if (event.touches.length !== 1 || isoGridPinchActive) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const touchId = touch.identifier;
        const findTouch = e => Array.from(e.changedTouches || []).find(item => item.identifier === touchId)
          || Array.from(e.touches || []).find(item => item.identifier === touchId)
          || null;
        beginDrag(touch.clientX, touch.clientY, window, 'touchmove', 'touchend', 'touchcancel',
          e => !!findTouch(e), findTouch);
        event.stopPropagation();
      }, { passive: true });

      element.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch') return;
        const pointerId = event.pointerId;
        beginDrag(event.clientX, event.clientY, window, 'pointermove', 'pointerup', 'pointercancel',
          e => e.pointerId === pointerId, e => e);
        event.stopPropagation();
      });
    });
  };
  bindMeasurementDrag('[data-grid-measure]', 'gridMeasure', 'measureLabelOffset');
  bindMeasurementDrag('[data-grid-rise]', 'gridRise', 'riseLabelOffset');
  bindMeasurementDrag('[data-grid-run]', 'gridRun', 'runLabelOffset');
  svg.querySelectorAll('[data-grid-segment]').forEach(element => {
    if (element.classList.contains('iso-end-handle')) return;
    let branchTouchStart = null;
    element.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      if (!touch) return;
      branchTouchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    element.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      const start = branchTouchStart;
      branchTouchStart = null;
      if (isoGridPinchActive || Date.now() < isoGridPinchSuppressUntil || (isoGridTapGuard && Date.now() <= isoGridTapGuard.until)) return;
      if (!touch || !start || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 18) return;
      const editingEndpoint = event.target.closest?.('.iso-end-handle, .iso-end-touch');
      const editingMeasure = event.target.closest?.('[data-grid-measure], [data-grid-rise], [data-grid-run]');
      if (editingEndpoint || editingMeasure) return;
      const index = +element.dataset.gridSegment;
      const touchEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: event.target,
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      if (isoGridMode === 'LINE' && isoGridStartBranchOnSegment(index, touchEvent)) {
        isoGridTapGuard = { until: Date.now() + 700 };
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false });
    element.addEventListener('touchcancel', () => { branchTouchStart = null; }, { passive: true });
    element.addEventListener('click', event => {
      event.stopPropagation();
      if (isoGridTapGuard) {
        if (Date.now() <= isoGridTapGuard.until) {
          event.preventDefault();
          return;
        }
        isoGridTapGuard = null;
      }
      const index = +element.dataset.gridSegment;
      if (isoGridMode !== 'LINE' && isoGridPlaceModeOnSegment(index, event)) return;
      const editingEndpoint = event.target.closest?.('.iso-end-handle, .iso-end-touch');
      const editingMeasure = event.target.closest?.('[data-grid-measure]');
      if (isoGridMode === 'LINE' && !editingEndpoint && !editingMeasure && isoGridStartBranchOnSegment(index, event)) return;
      isoGridSelectSegment(index);
    });
  });
  svg.querySelectorAll('[data-grid-olet]').forEach(element=>{
    element.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      isoGridSelectSymbol(+element.dataset.gridOlet);
      setTimeout(isoGridQuickEditOletCC,0);
    });
  });
  svg.querySelectorAll('[data-grid-symbol]').forEach(element => {
    element.addEventListener('click', event => {
      event.stopPropagation();
      isoGridSelectSymbol(+element.dataset.gridSymbol);
    });
    element.addEventListener('pointerdown', event => {
      isoGridStartSymbolDrag(event, +element.dataset.gridSymbol);
    });
  });
  const bindEndpointDrag = handle => {
    handle.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    handle.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' && isoGridPinchActive) return;
      if (isoGridMode !== 'LINE' && !isoGridIsFlange(isoGridMode)) return;
      const segmentIndex = +handle.dataset.gridSegment;
      const endpointKey = handle.dataset.gridEnd;
      const startX = event.clientX;
      const startY = event.clientY;
      const pointerId = event.pointerId;
      let dragging = false;
      let canceled = false;
      const move = moveEvent => {
        if (moveEvent.pointerId !== pointerId) return;
        if (event.pointerType === 'touch' && isoGridPinchActive) {
          canceled = true;
          cleanup();
          return;
        }
        if (!dragging && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 8) return;
        if (!dragging) {
          dragging = true;
          cleanup();
          isoGridStartEndpointDrag(event, segmentIndex, endpointKey);
        }
      };
      const up = upEvent => {
        if (upEvent.pointerId !== pointerId) return;
        const pinchBlocked = isoGridPinchActive || Date.now() < isoGridPinchSuppressUntil;
        cleanup();
        if (!dragging && !canceled && !pinchBlocked) {
          upEvent.preventDefault();
          upEvent.stopPropagation();
          if (isoGridIsFlange(isoGridMode)) {
            isoGridInstallFlangeAtEndpoint(segmentIndex, endpointKey);
            return;
          }
          if (isoGridMode === 'LINE') isoGridActivateEndpoint(segmentIndex, endpointKey);
        }
      };
      const cancel = cancelEvent => {
        if (cancelEvent.pointerId !== pointerId) return;
        canceled = true;
        cleanup();
      };
      const cleanup = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancel);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    });
  };
  svg.querySelectorAll('.iso-end-handle').forEach(bindEndpointDrag);
  svg.querySelectorAll('.iso-end-touch').forEach(bindEndpointDrag);
  isoGridUpdateEditor();
  isoGridUpdateQuickBar();
  isoGridSave();
}

function isoSetView(mode) {
  if (!['ISO', 'PLAN', 'ELEVATION'].includes(mode)) return;
  isoGridView = mode;
  isoGridLastPoint = null;
  isoGridSelectedSegment = -1;
  isoGridSelectedSymbol = -1;
  document.querySelectorAll('[data-iso-view]').forEach(button => button.classList.toggle('on', button.dataset.isoView === mode));
  const title = $('isoGridViewTitle');
  if (title) title.textContent = mode + ' GRID';
  const viewHelp = mode === 'ISO'
    ? 'ISO view auto-converted from the same shared drawing. Draw here or switch views without redrawing.'
    : mode === 'PLAN'
      ? 'Plan view auto-converted from the same shared drawing. Edits here stay linked to ISO and Elevation.'
      : 'Elevation view auto-converted from the same shared drawing. Edits here stay linked to ISO and Plan.';
  isoGridSetStatus(viewHelp + (isoFieldPhotoObjectUrl ? ' Your field photo underlay stays visible while you switch views.' : ''));
  isoGridSyncSpoolLegs();
  isoGridRender();
}

function isoGridSetMode(mode, button) {
  isoGridMode = mode || 'LINE';
  document.querySelectorAll('[data-iso-stamp]').forEach(item => item.classList.remove('on'));
  if (button) button.classList.add('on');
  if (isoGridMode === 'LINE') isoGridSetStatus('PIPE LINE mode: tap a start point, then keep tapping grid points to draw connected pipe.');
  else isoGridSetStatus(`STAMP mode: tap a grid point to place ${isoGridMode.replaceAll('_', ' ')}. Symbols can be dragged and rotated after placement.`);
}

function isoGridTap(event, bypassTapGuard = false) {
  if (!bypassTapGuard && isoGridTapGuard) {
    if (Date.now() <= isoGridTapGuard.until) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    isoGridTapGuard = null;
  }
  if (event.target.closest('[data-grid-symbol]')) return;
  const endpointTarget = event.target.closest('.iso-end-handle, .iso-end-touch');
  if (endpointTarget) {
    const endpointSegment = isoGridCurrent().segments[Number(endpointTarget.dataset.gridSegment)];
    const endpointPoint = endpointSegment?.[endpointTarget.dataset.gridEnd];
    const isActiveEndpoint = endpointPoint && isoGridLastPoint && endpointPoint.x === isoGridLastPoint.x && endpointPoint.y === isoGridLastPoint.y;
    if (!isActiveEndpoint) return;
  }
  const segmentTarget = event.target.closest('[data-grid-segment]');
  if (segmentTarget && isoGridMode === 'LINE') {
    const targetIndex = Number(segmentTarget.dataset.gridSegment);
    const targetSegment = isoGridCurrent().segments[targetIndex];
    if (targetSegment && isoGridLastPoint) {
      const rawDisplay = isoGridDisplayEventPoint(event, false, false);
      const aDisplay = targetSegment.a?.isoDisplayPoint && isoGridView === 'ISO' ? targetSegment.a.isoDisplayPoint : isoGridToViewPoint(targetSegment.a);
      const bDisplay = targetSegment.b?.isoDisplayPoint && isoGridView === 'ISO' ? targetSegment.b.isoDisplayPoint : isoGridToViewPoint(targetSegment.b);
      if (rawDisplay && Math.min(Math.hypot(rawDisplay.x - aDisplay.x, rawDisplay.y - aDisplay.y), Math.hypot(rawDisplay.x - bDisplay.x, rawDisplay.y - bDisplay.y)) > 14) return;
    } else return;
  }
  let point = isoGridEventPoint(event,isoGridMode==='LINE',isoGridMode==='LINE');
  if (!point) return;
  const drawing = isoGridCurrent();
  if (isoGridMode !== 'LINE') {
    if (isoGridMode === 'END_FLANGE') {
      const nearest = isoGridNearestSegment(point, 32);
      if (nearest) {
        const segment = drawing.segments[nearest.index];
        const distanceA = segment ? Math.hypot(point.x - segment.a.x, point.y - segment.a.y) : Infinity;
        const distanceB = segment ? Math.hypot(point.x - segment.b.x, point.y - segment.b.y) : Infinity;
        if (Math.min(distanceA, distanceB) <= 24) {
          isoGridInstallFlangeAtEndpoint(nearest.index, distanceA <= distanceB ? 'a' : 'b');
          return;
        }
      }
      isoGridSetStatus('END FLANGE: tap the end point of a pipe run. It installs as one flange line and does not split the pipe.');
      return;
    }
    if (isoGridBreaksPipe(isoGridMode)||isoGridMode==='OLET') {
      const nearest = isoGridNearestSegment(point);
      if (nearest && isoGridIsFlange(isoGridMode)) {
        const segment = drawing.segments[nearest.index];
        const nearA = segment && Math.hypot(nearest.point.x - segment.a.x, nearest.point.y - segment.a.y) < 8;
        const nearB = segment && Math.hypot(nearest.point.x - segment.b.x, nearest.point.y - segment.b.y) < 8;
        if (nearA || nearB) {
          isoGridInstallFlangeAtEndpoint(nearest.index, nearA ? 'a' : 'b');
          return;
        }
      }
      if(nearest&&isoGridMode==='OLET'&&isoGridAttachOlet(nearest.index,nearest.point)){
        isoGridReturnToLineMode();
        isoGridSetStatus('O-let installed on continuous pipe with C-C from section start.');
        isoGridRender();return;
      }
      if(nearest&&isoGridBreaksPipe(isoGridMode)&&isoGridSplitSegmentAt(nearest.index,nearest.point,isoGridMode)){
        const installedType = isoGridMode;
        isoGridReturnToLineMode();
        isoGridSetStatus(`${isoGridSymbolName(installedType)} installed in the run. The pipe is now two measured sections / Spool Legs. PIPE LINE mode is active again.`);
        isoGridRender();
        return;
      }
    }
    if(isoGridBreaksPipe(isoGridMode)||isoGridMode==='OLET'){
      isoGridSetStatus('Tap an existing pipe to install. O-lets never split pipe.');return;
    }
    const placedType = isoGridMode;
    const placedPoint = point;
    drawing.symbols.push({ ...placedPoint, type: placedType, rotation: 0, snapped: true, auto: false });
    isoGridSelectedSymbol = drawing.symbols.length - 1;
    isoGridSelectedSegment = -1;
    isoGridReturnToLineMode();
    isoGridSetStatus(`${isoGridSymbolName(placedType)} placed on the grid. PIPE LINE mode is active again; drag the fitting to another grid point if needed.`);
    isoGridRender();
    return;
  }
  if (!isoGridLastPoint) {
    isoGridLastPoint = point;
    isoGridSetStatus('Start point set. Tap the next grid point and the pipe line will draw automatically.');
    isoGridRender();
    isoGridFollowPoint(isoGridLastPoint);
    return;
  }
  if (isoGridView === 'ISO' && isoGridSnapEnabled) point = isoGridConstrainDisplayLine(isoGridLastPoint, point);
  if (point.x === isoGridLastPoint.x && point.y === isoGridLastPoint.y) {
    isoGridSetStatus('Choose a different grid point for the next pipe segment.');
    return;
  }
  drawing.segments.push({ a: { ...isoGridLastPoint }, b: { ...point }, measure: '', dimensionType: 'C-C', note: '', complete: false });
  isoGridSelectedSegment = drawing.segments.length - 1;
  isoGridSelectedSymbol = -1;
  isoGridLastPoint = point;
  isoGridSyncSpoolLegs();
  const branchTee = drawing.symbols.find(symbol => isoGridIsTee(symbol.type) && symbol.pipePoint && symbol.pipePoint.x === drawing.segments[drawing.segments.length - 1].a.x && symbol.pipePoint.y === drawing.segments[drawing.segments.length - 1].a.y);
  isoGridSetStatus(branchTee ? 'Branch drawn from tee. The tee run stays with the original pipe and the bullhead automatically follows this branch angle.' : 'Pipe segment drawn on the grid and added as a Spool Leg. Elbows stay manual; touch an existing pipe leg when you want to start a tee branch.');
  isoGridRender();
  isoGridFollowPoint(isoGridLastPoint);
}

function isoGridSelectSegment(index) {
  const drawing = isoGridCurrent();
  if (!drawing.segments[index]) return;
  isoGridSelectedSegment = index;
  isoGridSelectedSymbol = -1;
  isoGridSetStatus(`Pipe section S${index + 1} selected. Edit its DIM and measurement in the drawing toolbar, or drag either amber endpoint handle.`);
  isoGridRender();
}

function isoGridActivateEndpoint(segmentIndex, endpointKey) {
  const drawing = isoGridCurrent();
  const segment = drawing.segments[segmentIndex];
  const endpoint = segment?.[endpointKey];
  if (!endpoint) return;
  isoGridMode = 'LINE';
  document.querySelectorAll('[data-iso-stamp]').forEach(item => item.classList.toggle('on', item.dataset.isoStamp === 'LINE'));
  isoGridSelectedSegment = segmentIndex;
  isoGridSelectedSymbol = -1;
  isoGridLastPoint = { ...endpoint };
  isoGridTapGuard = { until: Date.now() + 500 };
  isoGridSetStatus(`Endpoint highlighted on S${segmentIndex + 1}. Your next grid tap draws from this point. Drag the amber handle if you want to move the endpoint instead.`);
  isoGridRender();
}

function isoGridSelectSymbol(index) {
  const drawing = isoGridCurrent();
  if (!drawing.symbols[index]) return;
  isoGridSelectedSymbol = index;
  isoGridSelectedSegment = -1;
  const symbol = drawing.symbols[index];
  if(symbol.type==='OLET'&&isoGridOletSegment(symbol))isoGridSetStatus('O-let selected on continuous pipe. Tap EDIT O-LET C-C to adjust its location.');
  else if (isoGridIsTee(symbol.type)) isoGridSetStatus(`${isoGridSymbolName(symbol.type)} selected. Rotate controls move only the bullhead / branch; the straight-through run stays with the pipe.`);
  else isoGridSetStatus(`${isoGridSymbolName(symbol.type)} selected. Drag it to another grid point without changing the pipe, or rotate it ±15° / 90°.`);
  isoGridRender();
}

function isoGridReflowMeasuredRun(selectedIndex) {
  const drawing = isoGridCurrent();
  const selected = drawing.segments[selectedIndex];
  if (!selected) return false;
  const same = (p, q) => p && q && Math.hypot(p.x - q.x, p.y - q.y) < 0.01;
  const otherEnd = (segment, point) => same(segment.a, point) ? segment.b : same(segment.b, point) ? segment.a : null;
  const continuation = (segmentIndex, point) => {
    const segment = drawing.segments[segmentIndex];
    const towardCurrent = otherEnd(segment, point);
    if (!towardCurrent) return -1;
    const vx = towardCurrent.x - point.x;
    const vy = towardCurrent.y - point.y;
    const vl = Math.hypot(vx, vy) || 1;
    let best = -1;
    let bestDot = 1;
    drawing.segments.forEach((candidate, index) => {
      if (index === segmentIndex || candidate.offsetAuto) return;
      const away = otherEnd(candidate, point);
      if (!away) return;
      const wx = away.x - point.x;
      const wy = away.y - point.y;
      const wl = Math.hypot(wx, wy) || 1;
      const dot = (vx * wx + vy * wy) / (vl * wl);
      if (dot < -0.96 && dot < bestDot) { bestDot = dot; best = index; }
    });
    return best;
  };
  const walk = (startIndex, startPoint) => {
    const found = [];
    let index = startIndex;
    let point = { ...startPoint };
    const seen = new Set([startIndex]);
    while (true) {
      const next = continuation(index, point);
      if (next < 0 || seen.has(next)) break;
      found.push(next);
      seen.add(next);
      const nextPoint = otherEnd(drawing.segments[next], point);
      if (!nextPoint) break;
      point = { ...nextPoint };
      index = next;
    }
    return found;
  };
  const left = walk(selectedIndex, selected.a).reverse();
  const right = walk(selectedIndex, selected.b);
  const indices = [...left, selectedIndex, ...right];
  if (indices.length < 2) return false;

  let startPoint;
  if (indices.length === 1) startPoint = drawing.segments[indices[0]].a;
  else {
    const first = drawing.segments[indices[0]];
    const second = drawing.segments[indices[1]];
    startPoint = (same(first.a, second.a) || same(first.a, second.b)) ? first.b : first.a;
  }
  const nodes = [{ ...startPoint }];
  let cursor = { ...startPoint };
  for (const index of indices) {
    const next = otherEnd(drawing.segments[index], cursor);
    if (!next) return false;
    nodes.push({ ...next });
    cursor = { ...next };
  }

  // Unmeasured sections participate immediately, using their original drawing
  // scale. Retain those inferred lengths so repeated saves cannot drift the tees.
  const measures = indices.map(index => {
    const segment = drawing.segments[index];
    const value = segment.measure?.trim();
    if (value) {
      try { return literal(value); } catch { return NaN; }
    }
    return segment.autoMeasureInches > 0 ? segment.autoMeasureInches : isoGridSegmentLength(segment);
  });
  if (measures.some(value => !(value > 0))) return false;
  const total = measures.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return false;

  indices.forEach((index, position) => {
    const segment = drawing.segments[index];
    if (!segment.measure?.trim()) segment.autoMeasureInches = measures[position];
  });
  const start = nodes[0];
  const end = nodes[nodes.length - 1];
  const moves = [];
  let cumulative = 0;
  for (let i = 1; i < nodes.length - 1; i += 1) {
    cumulative += measures[i - 1];
    const ratio = cumulative / total;
    const target = {
      x: start.x + (end.x - start.x) * ratio,
      y: start.y + (end.y - start.y) * ratio,
    };
    moves.push({ from: nodes[i], to: target });
  }
  // Carry a branch subtree with its tee so its angle and entered length stay
  // intact. A loop tied back into this run keeps its other attachment fixed.
  const runIndices = new Set(indices);
  const visitedBranches = new Set();
  drawing.segments.forEach((segment, index) => {
    if (runIndices.has(index) || visitedBranches.has(index)) return;
    const component = [];
    const queue = [index];
    while (queue.length) {
      const currentIndex = queue.pop();
      if (visitedBranches.has(currentIndex)) continue;
      visitedBranches.add(currentIndex);
      const current = drawing.segments[currentIndex];
      component.push(current);
      drawing.segments.forEach((candidate, candidateIndex) => {
        if (runIndices.has(candidateIndex) || visitedBranches.has(candidateIndex)) return;
        if ([current.a, current.b].some(point => same(point, candidate.a) || same(point, candidate.b))) queue.push(candidateIndex);
      });
    }
    const branchPoints = component.flatMap(item => [item.a, item.b]);
    const anchors = nodes.filter(node => branchPoints.some(point => same(point, node)));
    if (anchors.length !== 1) return;
    const anchorMove = moves.find(move => same(move.from, anchors[0]));
    if (!anchorMove) return;
    const dx = anchorMove.to.x - anchorMove.from.x;
    const dy = anchorMove.to.y - anchorMove.from.y;
    branchPoints.forEach(point => {
      if (moves.some(move => same(move.from, point))) return;
      moves.push({ from: { ...point }, to: { x: point.x + dx, y: point.y + dy } });
    });
  });
  // Apply from the original geometry in one pass. Sequential moves can merge
  // two tees when one target happens to equal another tee's old position.
  const movedPoint = point => {
    const move = moves.find(item => same(point, item.from));
    return move ? { ...move.to } : point;
  };
  drawing.segments.forEach(segment => {
    segment.a = movedPoint(segment.a);
    segment.b = movedPoint(segment.b);
  });
  drawing.symbols.forEach(symbol => {
    if (!symbol.snapped && !symbol.auto && !symbol.pipePoint) return;
    const target = movedPoint(symbol.pipePoint || symbol);
    if (target === (symbol.pipePoint || symbol)) return;
    const dx = target.x - (symbol.pipePoint || symbol).x;
    const dy = target.y - (symbol.pipePoint || symbol).y;
    symbol.x += dx;
    symbol.y += dy;
    if (symbol.pipePoint) symbol.pipePoint = { ...target };
  });
  if (isoGridLastPoint) isoGridLastPoint = movedPoint(isoGridLastPoint);
  return true;
}

function isoGridSaveSegmentInfo() {
  const selected=isoGridCurrent().symbols[isoGridSelectedSymbol];
  if(selected?.type==='OLET'&&isoGridOletSegment(selected)){
    const s=isoGridOletSegment(selected),entered=$('isoGridMeasure')?.value.trim()||'';
    let n;try{n=literal(entered);}catch{n=NaN;}
    const length=isoGridSegmentInches(s);
    if(!(n>=0)||!(length>0)||n>length){
      isoGridSetStatus('O-let C-C must be between 0 and this pipe section C-C length.');return;
    }
    selected.ccMeasure=entered;selected.positionFraction=n/length;
    isoGridSyncOlets();isoGridSetStatus('O-let moved to its measured C-C. Pipe remains continuous.');
    isoGridRender();return;
  }
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) {
    isoGridSetStatus('Select a pipe section first.');
    return;
  }
  segment.dimensionType = $('isoGridDimensionType') ? $('isoGridDimensionType').value : 'C-C';
  segment.measure = $('isoGridMeasure') ? $('isoGridMeasure').value.trim() : '';
  segment.riseMeasure = $('isoGridRiseMeasure') ? $('isoGridRiseMeasure').value.trim() : '';
  segment.runMeasure = $('isoGridRunMeasure') ? $('isoGridRunMeasure').value.trim() : '';
  segment.note = $('isoGridNote') ? $('isoGridNote').value.trim() : '';
  const offsetMath = isoGridApplyOffsetGeometry(segment);
  const runReflowed = !offsetMath && isoGridReflowMeasuredRun(isoGridSelectedSegment);
  isoGridSyncOlets();
  isoGridSyncSpoolLegs();
  isoGridSetStatus(offsetMath ? `OFFSET ${offsetMath.angle.toFixed(1)}° calculated from RISE ${segment.riseMeasure} and RUN ${segment.runMeasure}. Travel is ${fmtFeet(offsetMath.travel)} and its drawn length is kept proportional to other measured pipe while remaining on the in-between ISO plane.` : runReflowed ? `Section S${isoGridSelectedSegment + 1} saved. Tee location(s) on this straight run were repositioned to match the entered pipe measurements proportionally.` : `Section S${isoGridSelectedSegment + 1} saved. Travel: ${segment.dimensionType} ${isoGridSegmentMeasure(segment)}${segment.riseMeasure ? ` • RISE ${segment.riseMeasure}` : ''}${segment.runMeasure ? ` • RUN ${segment.runMeasure}` : ''}.`);
  isoGridRender();
}

function isoGridToggleSegmentComplete() {
  const segment = isoGridCurrent().segments[isoGridSelectedSegment];
  if (!segment) {
    isoGridSetStatus('Select a pipe section first.');
    return;
  }
  segment.complete = !segment.complete;
  isoGridSetStatus(`Section S${isoGridSelectedSegment + 1} marked ${segment.complete ? 'complete' : 'open'}.`);
  isoGridRender();
}

function isoGridDeleteSelectedSegment() {
  const drawing = isoGridCurrent();
  if (isoGridSelectedSegment < 0 || !drawing.segments[isoGridSelectedSegment]) {
    isoGridSetStatus('Select a pipe section first.');
    return;
  }
  const removed = drawing.segments[isoGridSelectedSegment];
  if (isoGridView === 'ISO' && typeof isoGridRemoveLinkedLeg === 'function') isoGridRemoveLinkedLeg(removed);
  drawing.segments.splice(isoGridSelectedSegment, 1);
  isoGridSelectedSegment = -1;
  isoGridLastPoint = null;
  isoGridCleanupAutoSymbols();
  isoGridSyncSpoolLegs();
  isoGridSetStatus('Selected pipe section and its linked Spool Leg deleted.');
  isoGridRender();
}

function isoGridAddFittingToSelected(type) {
  const drawing = isoGridCurrent();
  const segment = drawing.segments[isoGridSelectedSegment];
  if (!segment) {
    isoGridSetStatus('Select a pipe section first, then choose a fitting.');
    return;
  }
  const midpoint = { x: (segment.a.x + segment.b.x) / 2, y: (segment.a.y + segment.b.y) / 2 };
  const placedPoint = isoGridBreaksPipe(type) || type === 'OLET' ? midpoint : isoGridSnapPointToSegmentGrid(segment, midpoint, false, false);
  const x = placedPoint.x;
  const y = placedPoint.y;
  if (isoGridBreaksPipe(type) && isoGridSplitSegmentAt(isoGridSelectedSegment, placedPoint, type)) {
    isoGridSetStatus(`${isoGridSymbolName(type)} installed at the split point. The original pipe is now two measured sections / Spool Legs so you know the fitting location.`);
    isoGridRender();
    return;
  }
  if(isoGridBreaksPipe(type)){isoGridSetStatus('Select a longer section; this one is too short for a fitting split.');return;}
  if(type==='OLET'){
    isoGridAttachOlet(isoGridSelectedSegment,placedPoint);
    isoGridSetStatus('O-let attached without a pipe break. Tap its C-C label to edit.');
    isoGridRender();return;
  }
  const rotation = Math.atan2(segment.b.y - segment.a.y, segment.b.x - segment.a.x) * 180 / Math.PI;
  drawing.symbols.push({ x, y, type, rotation, snapped: false, auto: false });
  isoGridSelectedSymbol = drawing.symbols.length - 1;
  isoGridSelectedSegment = -1;
  isoGridSetStatus(`${isoGridSymbolName(type)} inserted on the pipe. Drag it wherever you want and rotate it to any orientation.`);
  isoGridRender();
}

function isoGridRotateSelected(delta) {
  const symbol = isoGridCurrent().symbols[isoGridSelectedSymbol];
  if (!symbol) {
    isoGridSetStatus('Select a fitting symbol first.');
    return;
  }
  if (isoGridIsTee(symbol.type)) {
    symbol.branchRotation = ((symbol.branchRotation || 0) + delta) % 360;
    isoGridSetStatus(`${isoGridSymbolName(symbol.type)} bullhead rotated to ${symbol.branchRotation.toFixed(0)}°. The straight-through run stayed aligned with the pipe.`);
  } else {
    if(symbol.splitNode||symbol.type==='OLET')symbol.rotationTrim=((symbol.rotationTrim||0)+delta)%360;
    else symbol.rotation=((symbol.rotation||0)+delta)%360;
    if (symbol.type === 'NORTH_ARROW') {
      isoGridSyncSpoolLegs();
      isoGridSetStatus(`Job north rotated to ${symbol.rotation.toFixed(0)}°. Section compass directions updated automatically.`);
    } else {
      isoGridSetStatus(`${isoGridSymbolName(symbol.type)} rotated to ${symbol.rotation.toFixed(0)}°.`);
    }
  }
  isoGridRender();
}

function isoGridSnapSelectedSymbol() {
  const symbol = isoGridCurrent().symbols[isoGridSelectedSymbol];
  if (!symbol) {
    isoGridSetStatus('Select a fitting symbol first.');
    return;
  }
  if(symbol.type==='OLET'&&isoGridOletSegment(symbol)){
    isoGridSyncOlets();isoGridSetStatus('O-let is attached to the pipe. Edit its C-C to move it.');isoGridRender();return;
  }
  if(symbol.splitNode){
    isoGridSetStatus('Inline fitting is attached to the pipe junction. Drag along the run or edit C-C.');return;
  }
  const node = isoGridNearestNode(symbol, Infinity);
  if (!node) {
    isoGridSetStatus('No pipe node is available to snap to.');
    return;
  }
  symbol.x = node.x;
  symbol.y = node.y;
  symbol.snapped = true;
  isoGridSetStatus(`${isoGridSymbolName(symbol.type)} snapped to the nearest pipe endpoint/corner. Pipe geometry was not changed.`);
  isoGridRender();
}

function isoGridDeleteSelectedSymbol() {
  const drawing = isoGridCurrent();
  if (isoGridSelectedSymbol < 0 || !drawing.symbols[isoGridSelectedSymbol]) {
    isoGridSetStatus('Select a fitting symbol first.');
    return;
  }
  const symbol = drawing.symbols[isoGridSelectedSymbol];
  if (symbol.type === 'NORTH_ARROW') {
    isoGridSetStatus('The North arrow stays on the drawing. Move or rotate it instead of deleting it.');
    return;
  }
  if (symbol.splitNode) {
    const fitPoint = symbol.pipePoint || symbol;
    drawing.segments.forEach(segment => {
      if (segment.a.x === fitPoint.x && segment.a.y === fitPoint.y) segment.startFitType = '';
      if (segment.b.x === fitPoint.x && segment.b.y === fitPoint.y) segment.endFitType = '';
    });
  }
  drawing.symbols.splice(isoGridSelectedSymbol, 1);
  isoGridSelectedSymbol = -1;
  isoGridSyncSpoolLegs();
  isoGridSetStatus('Selected fitting symbol deleted. The two pipe sections stay separate until you redraw or delete one.');
  isoGridRender();
}


function isoGridFittingDragPreview(symbol,index,event) {
  let preview=document.getElementById('isoFittingDragPreview');
  if(!preview){
    preview=document.createElement('div');
    preview.id='isoFittingDragPreview';
    preview.style.cssText='position:fixed;width:126px;min-height:122px;z-index:99999;pointer-events:none;background:#ffffffee;border:2px solid #d97706;border-radius:14px;box-shadow:0 5px 20px #11182755;padding:3px;text-align:center;color:#10263d;font:700 11px system-ui,sans-serif;';
    document.body.appendChild(preview);
  }
  const point=symbol.annotation?isoGridClampPoint(symbol):isoGridToViewPoint(symbol);
  const svg=isoGridSymbolMarkup(symbol,index);
  preview.innerHTML='<div style="font-size:10px">POSITION PREVIEW</div><svg viewBox="0 0 120 92" width="116" height="89"><g transform="translate('+(60-point.x)+' '+(44-point.y)+')">'+svg+'</g></svg><div>'+isoGridEsc(isoGridSymbolName(symbol.type))+'</div>';
  const vw=window.innerWidth||400,vh=window.innerHeight||800;
  let x=event.clientX+34,y=event.clientY-146;
  if(x+132>vw)x=event.clientX-158;
  x=Math.max(4,Math.min(vw-132,x));
  y=Math.max(4,Math.min(vh-130,y));
  preview.style.left=x+'px';preview.style.top=y+'px';
}
function isoGridRemoveFittingPreview() {
  document.getElementById('isoFittingDragPreview')?.remove();
}
function isoGridStartSymbolDrag(event,index){
  if(isoGridPinchActive)return;
  const drawing=isoGridCurrent(),symbol=drawing.symbols[index];
  if(!symbol)return;
  event.preventDefault();event.stopPropagation();
  isoGridSelectedSymbol=index;isoGridSelectedSegment=-1;
  const pointerId=event.pointerId,startX=event.clientX,startY=event.clientY;
  let moved=false,finished=false;
  isoGridFittingDragActive=true;
  isoGridPanActive=false;
  const cleanup=()=>{
    isoGridFittingDragActive=false;
    isoGridRemoveFittingPreview();
    window.removeEventListener('pointermove',move);
    window.removeEventListener('pointerup',finish);
    window.removeEventListener('pointercancel',cancel);
    window.removeEventListener('blur',blur);
  };
  const move=e=>{
    if(finished||e.pointerId!==pointerId)return;
    if(isoGridPinchActive){cancel(e);return;}
    if(!moved && Math.hypot(e.clientX-startX,e.clientY-startY)<7)return;
    moved=true;
    e.preventDefault();e.stopPropagation();
    if(symbol.type==='NORTH_ARROW'){
      const p=isoGridDisplayEventPoint(e,false,false);
      if(p){symbol.x=p.x;symbol.y=p.y;symbol.snapped=false;}
    }else{
      const p=isoGridEventPoint(e,false,false);
      if(!p)return;
      if(symbol.splitNode){
        isoGridMoveSplitFitting(symbol,p);
      }else if(symbol.type==='OLET'&&isoGridOletSegment(symbol)){
        const seg=isoGridOletSegment(symbol),projected=isoGridProjectOnSegment(seg,p);
        if(projected){
          symbol.positionFraction=projected.t;
          symbol.ccMeasure='';
          isoGridSyncOlets();
        }
      }else{
        const hit=isoGridNearestSegment(p,26);
        const target=hit?hit.point:isoGridNearestNode(p,20)||p;
        symbol.x=target.x;symbol.y=target.y;
        if(hit){
          const seg=drawing.segments[hit.index],a=isoGridToViewPoint(seg.a),b=isoGridToViewPoint(seg.b);
          symbol.rotation=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
        }
        symbol.snapped=!!hit;
      }
    }
    isoGridRender();
    isoGridFittingDragPreview(symbol,index,e);
    isoGridPanSuppressUntil=Date.now()+650;
  };
  const finish=e=>{
    if(finished || e?.pointerId!=null&&e.pointerId!==pointerId)return;
    finished=true;cleanup();
    if(moved){
      isoGridTapGuard={until:Date.now()+850};
      isoGridPanSuppressUntil=Date.now()+850;
      isoGridSyncOlets();
      isoGridSyncSpoolLegs();
      isoGridSetStatus(symbol.splitNode?'Fitting moved with its connected pipe junction. Edit C-C section measurements for exact position.':
        symbol.type==='OLET'?'O-let moved on continuous pipe. Its C-C location updated.':
        isoGridSymbolName(symbol.type)+' moved. Preview shows the placement beside your finger.');
    }
    isoGridRender();
  };
  const cancel=e=>{
    if(e?.pointerId!=null&&e.pointerId!==pointerId)return;
    finish(e);
  };
  const blur=()=>finish();
  window.addEventListener('pointermove',move,{passive:false});
  window.addEventListener('pointerup',finish);
  window.addEventListener('pointercancel',cancel);
  window.addEventListener('blur',blur);
}
// Keep room ahead of the active endpoint without changing the user's zoom.
function isoGridFollowPoint(point) {
  const viewport = $('isoTapViewport');
  const scene = $('isoTapScene');
  if (!viewport || !scene || !point || !viewport.clientWidth || !viewport.clientHeight) return;
  const display = point.isoDisplayPoint && isoGridView === 'ISO' ? point.isoDisplayPoint : isoGridToViewPoint(point);
  const rect = scene.getBoundingClientRect();
  const x = display.x * rect.width / ISO_GRID_WIDTH;
  const y = display.y * rect.height / ISO_GRID_HEIGHT;
  const follow = (position, scroll, size, extent) => {
    const margin = Math.min(100, size * 0.28);
    if (position < scroll + margin) return Math.max(0, position - margin);
    if (position > scroll + size - margin) return Math.max(0, Math.min(extent - size, position - size + margin));
    return scroll;
  };
  viewport.scrollLeft = follow(x, viewport.scrollLeft, viewport.clientWidth, viewport.scrollWidth);
  viewport.scrollTop = follow(y, viewport.scrollTop, viewport.clientHeight, viewport.scrollHeight);
}

function isoGridEdgePanVelocity(position, start, size) {
  const edge = Math.min(64, size / 4);
  if (edge <= 0) return 0;
  if (position < start + edge) return -420 * Math.min(1, (start + edge - position) / edge);
  if (position > start + size - edge) return 420 * Math.min(1, (position - start - size + edge) / edge);
  return 0;
}

function isoGridStartEndpointDrag(event, segmentIndex, endpointKey) {
  event.preventDefault();
  event.stopPropagation();
  const drawing = isoGridCurrent();
  const segment = drawing.segments[segmentIndex];
  if (!segment) return;
  isoGridSelectedSegment = segmentIndex;
  isoGridSelectedSymbol = -1;
  const original = { ...segment[endpointKey] };
  const wasActiveEndpoint = !!isoGridLastPoint && isoGridLastPoint.x === original.x && isoGridLastPoint.y === original.y;
  let lastPoint = { ...original };
  isoGridEndpointDragging = true;
  isoGridPanActive = false;
  let pointer = { clientX: event.clientX, clientY: event.clientY };
  let frame = 0;
  let previousTime = 0;
  let finished = false;
  const targets = [];
  drawing.segments.forEach((item, index) => {
    ['a', 'b'].forEach(key => {
      if (item[key].x === original.x && item[key].y === original.y) targets.push({ index, key });
    });
  });
  const followingSymbols = [];
  drawing.symbols.forEach((symbol, index) => {
    if ((symbol.auto || symbol.snapped) && Math.hypot(symbol.x - original.x, symbol.y - original.y) < 1) followingSymbols.push(index);
  });
  const applyPointer = () => {
    const point = isoGridEventPoint(pointer, true, true);
    if (!point) return;
    lastPoint = point;
    targets.forEach(target => {
      drawing.segments[target.index][target.key] = { ...point };
    });
    followingSymbols.forEach(index => {
      if (drawing.symbols[index]) {
        drawing.symbols[index].x = point.x;
        drawing.symbols[index].y = point.y;
        if (drawing.symbols[index].pipePoint) drawing.symbols[index].pipePoint = { ...point };
      }
    });
    if (wasActiveEndpoint) isoGridLastPoint = { ...point };
    isoGridRender();
  };
  const move = moveEvent => {
    if (moveEvent.pointerId !== event.pointerId || finished) return;
    if (isoGridPinchActive) { up(); return; }
    moveEvent.preventDefault();
    pointer = { clientX: moveEvent.clientX, clientY: moveEvent.clientY };
    applyPointer();
  };
  const tick = time => {
    if (finished) return;
    if (isoGridPinchActive) { up(); return; }
    const dt = previousTime ? Math.min(32, time - previousTime) / 1000 : 0;
    previousTime = time;
    const viewport = $('isoTapViewport');
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const left = viewport.scrollLeft;
      const top = viewport.scrollTop;
      viewport.scrollLeft += isoGridEdgePanVelocity(pointer.clientX, rect.left, viewport.clientWidth) * dt;
      viewport.scrollTop += isoGridEdgePanVelocity(pointer.clientY, rect.top, viewport.clientHeight) * dt;
      // Recompute the endpoint from its screen position after every pan, even
      // when the finger is held still at the edge.
      if (viewport.scrollLeft !== left || viewport.scrollTop !== top) applyPointer();
    }
    frame = requestAnimationFrame(tick);
  };
  const up = endEvent => {
    if (endEvent && endEvent.pointerId !== event.pointerId) return;
    if (finished) return;
    finished = true;
    isoGridEndpointDragging = false;
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    window.removeEventListener('blur', blur);
    isoGridPanSuppressUntil = Date.now() + 650;
    isoGridTapGuard = { until: Date.now() + 1000 };
    if (wasActiveEndpoint) isoGridLastPoint = { ...lastPoint };
    isoGridRemoveAutoAt(original);
    isoGridSyncSpoolLegs();
    isoGridSetStatus(wasActiveEndpoint
      ? 'Endpoint corrected. This same moved endpoint is still your active pipe point; your next tap continues from here. Releasing the handle does not add a point.'
      : 'Endpoint corrected. Your current active pipe point was not changed. Releasing the handle does not add a point.');
    isoGridRender();
  };
  const blur = () => up();
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  window.addEventListener('blur', blur);
  frame = requestAnimationFrame(tick);
}

function isoGridSegmentsAtPoint(point) {
  return isoGridCurrent().segments.filter(segment =>
    (segment.a.x === point.x && segment.a.y === point.y) ||
    (segment.b.x === point.x && segment.b.y === point.y));
}

function isoGridVectorAway(segment, point) {
  if (segment.a.x === point.x && segment.a.y === point.y) return { x: segment.b.x - point.x, y: segment.b.y - point.y };
  return { x: segment.a.x - point.x, y: segment.a.y - point.y };
}

function isoGridTurnAngle(point) {
  const connected = isoGridSegmentsAtPoint(point);
  if (connected.length !== 2) return null;
  const v1 = isoGridVectorAway(connected[0], point);
  const v2 = isoGridVectorAway(connected[1], point);
  const l1 = Math.hypot(v1.x, v1.y);
  const l2 = Math.hypot(v2.x, v2.y);
  if (!l1 || !l2) return null;
  const dot = Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)));
  const interior = Math.acos(dot) * 180 / Math.PI;
  return 180 - interior;
}

function isoGridHasManualSymbolNear(point) {
  return isoGridCurrent().symbols.some(symbol => !symbol.auto && Math.hypot(symbol.x - point.x, symbol.y - point.y) <= 16);
}

function isoGridRemoveAutoAt(point) {
  const drawing = isoGridCurrent();
  drawing.symbols = drawing.symbols.filter(symbol => !(symbol.auto && Math.hypot(symbol.x - point.x, symbol.y - point.y) <= 3));
  if (isoGridSelectedSymbol >= drawing.symbols.length) isoGridSelectedSymbol = -1;
}

function isoGridCleanupAutoSymbols() {
  const drawing = isoGridCurrent();
  drawing.symbols = drawing.symbols.filter(symbol => {
    if (!symbol.auto) return true;
    const angle = isoGridTurnAngle(symbol);
    return angle != null && (Math.abs(angle - 90) <= 7.5 || Math.abs(angle - 45) <= 7.5);
  });
}

function isoGridAutoElbowAt(point) {
  isoGridRemoveAutoAt(point);
  return '';
}

function isoGridNewRun() {
  isoGridLastPoint = null;
  isoGridMode = 'LINE';
  document.querySelectorAll('[data-iso-stamp]').forEach(item => item.classList.toggle('on', item.dataset.isoStamp === 'LINE'));
  isoGridSetStatus('New run: tap the first grid point.');
  isoGridRender();
}

function isoGridZoomBy(delta) {
  isoGridZoom = Math.max(0.8, Math.min(2.8, Math.round((isoGridZoom + delta) * 10) / 10));
  isoGridSetStatus(`Zoom ${isoGridZoom.toFixed(1)}×. Tap points to draw.`);
  isoGridRender();
}

function isoGridUndo() {
  const drawing = isoGridCurrent();
  if (isoGridSelectedSymbol >= 0 && drawing.symbols[isoGridSelectedSymbol]) {
    const selectedIndex = isoGridSelectedSymbol;
    const selectedSymbol = drawing.symbols[selectedIndex];
    if (selectedSymbol.type === 'NORTH_ARROW') {
      isoGridSelectedSymbol = -1;
      isoGridSetStatus('North arrow kept on the drawing.');
    } else if (selectedSymbol.splitNode && selectedSymbol.splitUndo?.segment) {
      const undo = selectedSymbol.splitUndo;
      const restoreIndex = Math.max(0, Math.min(Number.isFinite(+undo.index) ? +undo.index : 0, Math.max(0, drawing.segments.length - 1)));
      const first = drawing.segments[restoreIndex];
      const second = drawing.segments[restoreIndex + 1];
      const fitPoint = selectedSymbol.pipePoint || selectedSymbol;
      const touchesFit = item => item && (Math.hypot(item.a.x - fitPoint.x, item.a.y - fitPoint.y) < 0.01 || Math.hypot(item.b.x - fitPoint.x, item.b.y - fitPoint.y) < 0.01);
      if (touchesFit(first) && touchesFit(second)) {
        if (typeof isoGridRemoveLinkedLeg === 'function') {
          isoGridRemoveLinkedLeg(first);
          isoGridRemoveLinkedLeg(second);
        }
        const restored = { ...undo.segment, a: { ...undo.segment.a }, b: { ...undo.segment.b } };
        drawing.segments.splice(restoreIndex, 2, restored);
        drawing.symbols.splice(selectedIndex, 1);
        isoGridSelectedSymbol = -1;
        isoGridSelectedSegment = -1;
        isoGridLastPoint = undo.lastPoint ? { ...undo.lastPoint } : { ...restored.b };
        isoGridReturnToLineMode();
        isoGridCleanupAutoSymbols();
        isoGridSyncSpoolLegs();
        isoGridSetStatus(`${isoGridIsTee(selectedSymbol.type) ? 'Tee' : 'Split fitting'} undone. The original pipe is restored and the active drawing point is back where you were before the split.`);
        isoGridRender();
        return;
      }
      drawing.symbols.splice(selectedIndex, 1);
      isoGridSelectedSymbol = -1;
      isoGridSetStatus('Selected fitting removed.');
    } else {
      drawing.symbols.splice(selectedIndex, 1);
      isoGridSelectedSymbol = -1;
      isoGridSetStatus('Selected fitting removed.');
    }
  } else if (drawing.segments.length) {
    const segment = drawing.segments.pop();
    if (typeof isoGridRemoveLinkedLeg === 'function') isoGridRemoveLinkedLeg(segment);
    isoGridLastPoint = segment.a;
    isoGridSelectedSegment = Math.min(isoGridSelectedSegment, drawing.segments.length - 1);
    isoGridCleanupAutoSymbols();
    isoGridSyncSpoolLegs();
    isoGridSetStatus('Last pipe segment and linked Spool Leg removed.');
  } else if (isoGridLastPoint) {
    isoGridLastPoint = null;
    isoGridSetStatus('Start point cleared.');
  } else {
    isoGridSetStatus('Nothing to undo in the shared drawing.');
  }
  isoGridRender();
}

function isoGridClear() {
  if (!confirm('Clear the shared pipe drawing from ISO, Plan, and Elevation?')) return;
  if (typeof isoGridRemoveLinkedLeg === 'function') {
    isoGridCurrent().segments.forEach(segment => isoGridRemoveLinkedLeg(segment));
  }
  isoGridState.SHARED = { segments: [], symbols: [] };
  isoGridLastPoint = null;
  isoGridSelectedSegment = -1;
  isoGridSelectedSymbol = -1;
  if (!document.querySelector('.iso-leg') && typeof isoAddLeg === 'function') isoAddLeg({ direction: 'NE' });
  isoGridSetStatus('Shared drawing cleared from ISO, Plan, and Elevation. Tap a point to start.');
  isoGridRender();
}

function isoGridLoadFieldPhoto(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const photoExtension = /\.(jpe?g|png|gif|webp|heic|heif|avif)$/i.test(file.name || '');
  if (file.type && !file.type.startsWith('image/') && !photoExtension) {
    isoGridSetStatus('Choose a photo image from the camera or photo library.');
    input.value = '';
    return;
  }
  if (isoFieldPhotoObjectUrl) URL.revokeObjectURL(isoFieldPhotoObjectUrl);
  isoFieldPhotoObjectUrl = URL.createObjectURL(file);
  const image = $('isoFieldPhoto');
  if (!image) return;
  image.src = isoFieldPhotoObjectUrl;
  image.classList.remove('hidden');
  isoFieldPhotoVisible = true;
  isoGridSetPhotoOpacity($('isoPhotoOpacity')?.value || 0.5);
  const toggle = $('isoPhotoToggle');
  if (toggle) toggle.textContent = 'HIDE PHOTO';
  const name = $('isoPhotoName');
  if (name) name.textContent = `Field photo loaded: ${file.name}. Draw pipe, dimensions, and symbols over the photo. The image stays on this phone/browser session.`;
  isoGridSetStatus('Field photo loaded under the drawing. Leave SNAP ON for grid layout, or use SNAP OFF and hold-drag pipe endpoints to match the field piping slope and length.');
}

function isoGridSetPhotoOpacity(value) {
  const image = $('isoFieldPhoto');
  const opacity = Math.max(0.15, Math.min(0.9, parseFloat(value) || 0.5));
  if (image) image.style.opacity = String(opacity);
}

function isoGridTogglePhoto() {
  const image = $('isoFieldPhoto');
  if (!image || !isoFieldPhotoObjectUrl) {
    isoGridSetStatus('No field photo is loaded yet. Tap TAKE / UPLOAD FIELD PHOTO first.');
    return;
  }
  isoFieldPhotoVisible = !isoFieldPhotoVisible;
  image.classList.toggle('hidden', !isoFieldPhotoVisible);
  const toggle = $('isoPhotoToggle');
  if (toggle) toggle.textContent = isoFieldPhotoVisible ? 'HIDE PHOTO' : 'SHOW PHOTO';
  isoGridSetStatus(isoFieldPhotoVisible ? 'Field photo shown under the grid.' : 'Field photo hidden. Your pipe drawing is unchanged.');
}

function isoGridClearPhoto() {
  const image = $('isoFieldPhoto');
  if (isoFieldPhotoObjectUrl) URL.revokeObjectURL(isoFieldPhotoObjectUrl);
  isoFieldPhotoObjectUrl = '';
  isoFieldPhotoVisible = true;
  if (image) {
    image.removeAttribute('src');
    image.classList.add('hidden');
  }
  const input = $('isoPhotoInput');
  const cameraInput = $('isoCameraInput');
  if (input) input.value = '';
  if (cameraInput) cameraInput.value = '';
  const toggle = $('isoPhotoToggle');
  if (toggle) toggle.textContent = 'HIDE PHOTO';
  const name = $('isoPhotoName');
  if (name) name.textContent = 'No field photo loaded. The photo stays on this phone/browser session and is not uploaded.';
  isoGridSetStatus('Field photo cleared. The grid drawing and Spool Legs were not changed.');
}

function isoGridDrawExportGrid(context) {
  if (!isoGridVisible) return;
  context.save();
  for (let x = 0; x <= ISO_GRID_WIDTH; x += ISO_GRID_STEP) {
    context.beginPath();
    context.strokeStyle = x % 120 === 0 ? '#94a3b8' : '#e2e8f0';
    context.lineWidth = x % 120 === 0 ? 1.2 : 0.7;
    context.moveTo(x, 0);
    context.lineTo(x, ISO_GRID_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= ISO_GRID_HEIGHT; y += ISO_GRID_STEP) {
    context.beginPath();
    context.strokeStyle = y % 120 === 0 ? '#94a3b8' : '#e2e8f0';
    context.lineWidth = y % 120 === 0 ? 1.2 : 0.7;
    context.moveTo(0, y);
    context.lineTo(ISO_GRID_WIDTH, y);
    context.stroke();
  }
  context.restore();
}

function isoGridDrawExportPhoto(context) {
  const image = $('isoFieldPhoto');
  if (!isoFieldPhotoVisible || !image || !image.src || !image.complete || !image.naturalWidth || !image.naturalHeight) return;
  const scale = Math.min(ISO_GRID_WIDTH / image.naturalWidth, ISO_GRID_HEIGHT / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (ISO_GRID_WIDTH - width) / 2;
  const y = (ISO_GRID_HEIGHT - height) / 2;
  const opacity = Math.max(0.15, Math.min(0.9, parseFloat($('isoPhotoOpacity')?.value) || 0.5));
  context.save();
  context.globalAlpha = opacity;
  context.drawImage(image, x, y, width, height);
  context.restore();
}

function isoGridExportSvgText() {
  const source = $('isoTapSvg');
  if (!source) throw Error('ISO drawing is not available.');
  const clone = source.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(ISO_GRID_WIDTH));
  clone.setAttribute('height', String(ISO_GRID_HEIGHT));
  clone.setAttribute('viewBox', `0 0 ${ISO_GRID_WIDTH} ${ISO_GRID_HEIGHT}`);
  clone.removeAttribute('style');
  clone.querySelectorAll('.iso-end-handle,.iso-tap-current').forEach(element => element.remove());
  clone.querySelectorAll('.iso-tap-pipe.selected').forEach(element => element.classList.remove('selected'));
  clone.querySelectorAll('[data-grid-symbol] circle[stroke="#f59e0b"]').forEach(element => element.remove());
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = '.iso-tap-pipe{stroke:#111827;stroke-width:5;stroke-linecap:round}.iso-tap-pipe.complete{stroke:#16a34a;stroke-width:7}.iso-tap-hit{display:none}.iso-tap-node{fill:#fff;stroke:#111827;stroke-width:1.8}.iso-tap-witness,.iso-tap-dim{stroke:#1e3a8a;stroke-width:1;stroke-dasharray:1 4;stroke-linecap:round}.iso-tap-dim-bg{fill:#fff;stroke:#94a3b8;stroke-width:.8}.iso-tap-dim-text{fill:#111827;font-size:10px;font-weight:800;text-anchor:middle;font-family:monospace}.iso-tap-note{fill:#475569;stroke:#fff;stroke-width:3px;paint-order:stroke fill;text-anchor:middle;font-size:10px;font-family:monospace}';
  clone.insertBefore(style, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

async function isoGridBuildExportCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = ISO_GRID_WIDTH;
  canvas.height = ISO_GRID_HEIGHT;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  isoGridDrawExportPhoto(context);
  isoGridDrawExportGrid(context);
  const svgBlob = new Blob([isoGridExportSvgText()], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const overlay = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = svgUrl;
    });
    context.drawImage(overlay, 0, 0, ISO_GRID_WIDTH, ISO_GRID_HEIGHT);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
  return canvas;
}

async function isoGridSaveToPhotos() {
  try {
    isoGridSetStatus('Building a PNG of the current drawing view…');
    const canvas = await isoGridBuildExportCanvas();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw Error('Could not create PNG.');
    const date = new Date().toISOString().slice(0, 10);
    const filename = `pipefitter-${isoGridView.toLowerCase()}-${date}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try {
        await navigator.share({ files: [file], title: `Pipefitter ${isoGridView} drawing` });
        isoGridSetStatus('Share sheet opened. On iPhone choose Save Image to put the drawing in Photos.');
        return;
      } catch (error) {
        if (error?.name === 'AbortError') {
          isoGridSetStatus('Share canceled. Your drawing is unchanged.');
          return;
        }
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    isoGridSetStatus('PNG saved/downloaded. On iPhone open it and use Share → Save Image if the Photos share sheet did not open automatically.');
  } catch (error) {
    isoGridSetStatus(`Could not save the drawing image: ${isoGridEsc(error?.message || error)}`);
  }
}

function initIsoDrawing() {
  isoGridLoad();
  isoGridApplyDisplayState();
  const scene = $('isoTapScene');
  if (!scene) return;
  // Dedicated persistent first-run capture layer for iPhone Safari.
  // It is outside the SVG, so the SVG can redraw the orange start dot without
  // destroying the element that receives the next tap.
  isoGridTapGuard = null;
  let capture = $('isoFirstRunCapture');
  if (!capture) {
    capture = document.createElement('div');
    capture.id = 'isoFirstRunCapture';
    capture.className = 'iso-first-run-capture';
    scene.appendChild(capture);
  }
  let captureStart = null;
  capture.addEventListener('touchstart', event => {
    if (event.touches.length > 1) {
      captureStart = null;
      return;
    }
    const touch = event.changedTouches[0];
    if (!touch) return;
    captureStart = { x: touch.clientX, y: touch.clientY };
    event.preventDefault();
  }, { passive: false });
  capture.addEventListener('touchend', event => {
    const touch = event.changedTouches[0];
    const start = captureStart;
    captureStart = null;
    if (isoGridPinchActive || Date.now() < isoGridPinchSuppressUntil) return;
    if (!touch || !start || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 14) return;
    isoGridTap({
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: scene,
      preventDefault: () => {},
      stopPropagation: () => {},
    }, true);
    event.preventDefault();
  }, { passive: false });
  capture.addEventListener('touchcancel', () => { captureStart = null; }, { passive: true });
  capture.addEventListener('click', event => {
    if ('ontouchstart' in window) return;
    isoGridTap({ clientX: event.clientX, clientY: event.clientY, target: scene, preventDefault: () => {}, stopPropagation: () => {} }, true);
  });
  scene.addEventListener('click', event => {
    if (event.target === capture || Date.now() < isoGridPanSuppressUntil) return;
    isoGridTap(event, true);
  });

  // Direct pipe tap: a stationary finger tap near the body of an existing pipe
  // immediately installs a tee and makes that tee the active branch start.
  let directPipeTap = null;
  scene.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || isoGridPinchActive || isoGridMode !== 'LINE') {
      directPipeTap = null;
      return;
    }
    if (event.target.closest?.('[data-grid-symbol], .iso-end-handle, .iso-end-touch, [data-grid-measure], [data-grid-rise], [data-grid-run]')) {
      directPipeTap = null;
      return;
    }
    const touch = event.touches[0];
    directPipeTap = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }, { capture: true, passive: true });
  scene.addEventListener('touchend', event => {
    const start = directPipeTap;
    directPipeTap = null;
    if (!start || isoGridMode !== 'LINE' || isoGridPinchActive || isoGridPanActive || Date.now() < isoGridPinchSuppressUntil) return;
    const touch = event.changedTouches[0];
    if (!touch || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 18) return;
    if (event.target.closest?.('[data-grid-symbol], .iso-end-handle, .iso-end-touch, [data-grid-measure], [data-grid-rise], [data-grid-run]')) return;
    const tapEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      target: event.target,
      preventDefault: () => {},
      stopPropagation: () => {},
    };
    const point = isoGridEventPoint(tapEvent, false, false);
    const nearest = point ? isoGridNearestSegment(point, 28) : null;
    if (!nearest) return;
    const segment = isoGridCurrent().segments[nearest.index];
    if (!segment) return;
    const nearEnd = Math.min(
      Math.hypot(nearest.point.x - segment.a.x, nearest.point.y - segment.a.y),
      Math.hypot(nearest.point.x - segment.b.x, nearest.point.y - segment.b.y)
    );
    if (nearEnd < 6) return;
    // Use the geometrically projected point directly. This avoids iPhone/Safari
    // DOM hit-target differences and guarantees a pipe-body tap creates the split.
    if (isoGridStartBranchAtPoint(nearest.index, nearest.point)) {
      isoGridTapGuard = { until: Date.now() + 700 };
      isoGridPanSuppressUntil = Date.now() + 700;
      event.preventDefault();
      event.stopPropagation();
    }
  }, { capture: true, passive: false });
  scene.addEventListener('touchcancel', () => { directPipeTap = null; }, { capture: true, passive: true });

  // One-finger swipe pans around the drawing after zooming.
  // A stationary tap still draws/selects; movement turns the gesture into pan.
  const viewport = $('isoTapViewport');
  let panStart = null;
  scene.addEventListener('touchstart', event => {
    if (!viewport || event.touches.length !== 1 || isoGridPinchActive || isoGridEndpointDragging || isoGridFittingDragActive || event.target.closest?.('.iso-end-handle, .iso-end-touch, [data-grid-symbol], [data-grid-measure], [data-grid-rise], [data-grid-run]')) {
      panStart = null;
      return;
    }
    const touch = event.touches[0];
    panStart = {
      x: touch.clientX,
      y: touch.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      preferPipeTap: !!event.target.closest?.('.iso-tap-hit, .iso-tap-pipe'),
    };
    isoGridPanActive = false;
  }, { capture: true, passive: true });
  scene.addEventListener('touchmove', event => {
    if (!viewport || !panStart || event.touches.length !== 1 || isoGridPinchActive || isoGridEndpointDragging || isoGridFittingDragActive) return;
    const touch = event.touches[0];
    const dx = touch.clientX - panStart.x;
    const dy = touch.clientY - panStart.y;
    const panThreshold = panStart.preferPipeTap ? 18 : 9;
    if (!isoGridPanActive && Math.hypot(dx, dy) < panThreshold) return;
    isoGridPanActive = true;
    isoGridPanSuppressUntil = Date.now() + 650;
    captureStart = null;
    viewport.scrollLeft = panStart.scrollLeft - dx;
    viewport.scrollTop = panStart.scrollTop - dy;
    event.preventDefault();
  }, { capture: true, passive: false });
  const finishPan = event => {
    if (!panStart) return;
    const didPan = isoGridPanActive;
    panStart = null;
    isoGridPanActive = false;
    if (!didPan) return;
    isoGridPanSuppressUntil = Date.now() + 650;
    isoGridTapGuard = { until: Date.now() + 650 };
    event.preventDefault();
    event.stopPropagation();
  };
  scene.addEventListener('touchend', finishPan, { capture: true, passive: false });
  scene.addEventListener('touchcancel', event => {
    panStart = null;
    isoGridPanActive = false;
  }, { capture: true, passive: true });

  // Two-finger pinch zoom for the drawing itself on iPhone/iPad.
  // Keep tap-to-draw and tap-pipe-for-tee separate from multi-touch gestures.
  let pinchStartDistance = 0;
  let pinchStartZoom = isoGridZoom;
  let pinchCenter = null;
  const touchDistance = touches => Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY
  );
  scene.addEventListener('touchstart', event => {
    if (event.touches.length !== 2) return;
    isoGridPinchActive = true;
    isoGridPinchSuppressUntil = Date.now() + 500;
    captureStart = null;
    pinchStartDistance = Math.max(1, touchDistance(event.touches));
    pinchStartZoom = isoGridZoom;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const clientX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const clientY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      pinchCenter = {
        clientX,
        clientY,
        contentX: (viewport.scrollLeft + clientX - rect.left) / isoGridZoom,
        contentY: (viewport.scrollTop + clientY - rect.top) / isoGridZoom,
      };
    }
    event.preventDefault();
  }, { passive: false });
  scene.addEventListener('touchmove', event => {
    if (!isoGridPinchActive || event.touches.length !== 2) return;
    const nextZoom = Math.max(0.8, Math.min(2.8, pinchStartZoom * touchDistance(event.touches) / pinchStartDistance));
    isoGridZoom = Math.round(nextZoom * 100) / 100;
    const width = ISO_GRID_WIDTH * isoGridZoom;
    const height = ISO_GRID_HEIGHT * isoGridZoom;
    scene.style.width = `${width}px`;
    scene.style.height = `${height}px`;
    const svg = $('isoTapSvg');
    if (svg) {
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
    }
    if (viewport && pinchCenter) {
      const rect = viewport.getBoundingClientRect();
      const clientX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const clientY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      viewport.scrollLeft = pinchCenter.contentX * isoGridZoom - (clientX - rect.left);
      viewport.scrollTop = pinchCenter.contentY * isoGridZoom - (clientY - rect.top);
    }
    event.preventDefault();
  }, { passive: false });
  const finishPinch = event => {
    if (!isoGridPinchActive || event.touches.length >= 2) return;
    isoGridPinchActive = false;
    isoGridPinchSuppressUntil = Date.now() + 500;
    pinchCenter = null;
    isoGridSetStatus(`Zoom ${isoGridZoom.toFixed(1)}×. Pinch with two fingers to zoom, or tap points to draw.`);
    isoGridRender();
    isoGridSave();
    event.preventDefault();
  };
  scene.addEventListener('touchend', finishPinch, { passive: false });
  scene.addEventListener('touchcancel', event => {
    if (!isoGridPinchActive) return;
    isoGridPinchActive = false;
    isoGridPinchSuppressUntil = Date.now() + 500;
    pinchCenter = null;
    isoGridRender();
  }, { passive: false });

  // Pointer-event pinch path for embedded/in-app iOS browsers.
  // Some webviews suppress TouchEvent multi-touch but still expose touch pointers.
  const pinchPointers = new Map();
  let pointerPinchStartDistance = 0;
  let pointerPinchStartZoom = isoGridZoom;
  let pointerPinchCenter = null;
  const pointerPair = () => Array.from(pinchPointers.values()).slice(0, 2);
  const pointerDistance = pair => Math.hypot(pair[0].x - pair[1].x, pair[0].y - pair[1].y);
  const beginPointerPinch = pair => {
    isoGridPinchActive = true;
    isoGridPinchSuppressUntil = Date.now() + 600;
    captureStart = null;
    pointerPinchStartDistance = Math.max(1, pointerDistance(pair));
    pointerPinchStartZoom = isoGridZoom;
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const clientX = (pair[0].x + pair[1].x) / 2;
      const clientY = (pair[0].y + pair[1].y) / 2;
      pointerPinchCenter = {
        contentX: (viewport.scrollLeft + clientX - rect.left) / isoGridZoom,
        contentY: (viewport.scrollTop + clientY - rect.top) / isoGridZoom,
      };
    }
  };
  scene.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    pinchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchPointers.size === 2) {
      beginPointerPinch(pointerPair());
      event.preventDefault();
    }
  }, { capture: true });
  scene.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || !pinchPointers.has(event.pointerId)) return;
    pinchPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchPointers.size < 2 || !isoGridPinchActive) return;
    const pair = pointerPair();
    const nextZoom = Math.max(0.8, Math.min(2.8, pointerPinchStartZoom * pointerDistance(pair) / pointerPinchStartDistance));
    isoGridZoom = Math.round(nextZoom * 100) / 100;
    const width = ISO_GRID_WIDTH * isoGridZoom;
    const height = ISO_GRID_HEIGHT * isoGridZoom;
    scene.style.width = `${width}px`;
    scene.style.height = `${height}px`;
    const svg = $('isoTapSvg');
    if (svg) {
      svg.style.width = `${width}px`;
      svg.style.height = `${height}px`;
    }
    if (viewport && pointerPinchCenter) {
      const rect = viewport.getBoundingClientRect();
      const clientX = (pair[0].x + pair[1].x) / 2;
      const clientY = (pair[0].y + pair[1].y) / 2;
      viewport.scrollLeft = pointerPinchCenter.contentX * isoGridZoom - (clientX - rect.left);
      viewport.scrollTop = pointerPinchCenter.contentY * isoGridZoom - (clientY - rect.top);
    }
    event.preventDefault();
  }, { capture: true });
  const endPointerPinch = event => {
    if (event.pointerType !== 'touch') return;
    const wasPinching = isoGridPinchActive && pinchPointers.size >= 2;
    pinchPointers.delete(event.pointerId);
    if (!wasPinching || pinchPointers.size >= 2) return;
    isoGridPinchActive = false;
    isoGridPinchSuppressUntil = Date.now() + 600;
    pointerPinchCenter = null;
    isoGridSetStatus(`Zoom ${isoGridZoom.toFixed(1)}×. Two-finger pinch zoom is active.`);
    isoGridRender();
    isoGridSave();
    event.preventDefault();
  };
  scene.addEventListener('pointerup', endPointerPinch, { capture: true });
  scene.addEventListener('pointercancel', endPointerPinch, { capture: true });
  const scale = $('isoGridScale');
  if (scale) scale.addEventListener('change', () => {
    isoGridSetStatus('Drawing scale changed. Automatic dimensions were recalculated; manual section dimensions stay unchanged.');
    isoGridRender();
  });
  isoGridSetPhotoOpacity($('isoPhotoOpacity')?.value || 0.5);
  isoSetView(isoGridView);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initIsoDrawing);
else setTimeout(initIsoDrawing, 0);

