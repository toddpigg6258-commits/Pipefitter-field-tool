let isoCounter = 0;
let isoActiveId = null;

function isoEsc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isoDefaultLabel(id) {
  let a = String.fromCharCode(64 + ((id - 1) % 26) + 1),
    b = String.fromCharCode(64 + (id % 26) + 1);
  return a + '-' + b;
}

function isoSizes(system) {
  return system === 'threaded'
    ? orderedPipeSizes(Object.keys(W['90 Ell']))
    : orderedPipeSizes(Object.keys(OD));
}

function isoFits(system) {
  return system === 'threaded'
    ? [
        ['NONE', 'No fitting / straight end'],
        ['90 Ell', '90 Ell'],
        ['45 Ell', '45 Ell'],
        ['Tee', 'Tee'],
        ['REDUCER', 'Reducer / bushing — enter actual takeoff'],
        ['UNION', 'Union — enter actual takeoff'],
        ['COUPLING', 'Coupling — enter actual takeoff'],
        ['CAP', 'Cap — enter actual takeoff'],
        ['VALVE', 'Valve — enter actual face-to-face / takeoff'],
        ['CUSTOM', 'Other / custom takeoff'],
      ]
    : [
        ['NONE', 'No fitting / straight end'],
        ['LR90', '90° Long Radius Elbow'],
        ['SR90', '90° Short Radius Elbow'],
        ['LR45', '45° Long Radius Elbow'],
        ['TEE', 'Straight Tee'],
        ['REDUCER', 'Concentric reducer — enter exact takeoff'],
        ['ECC_REDUCER', 'Eccentric reducer — enter exact takeoff'],
        ['CAP', 'Cap — enter actual takeoff'],
        ['FLANGE', 'Flange — enter actual takeoff'],
        ['GATE_VALVE', 'Gate valve — enter actual face-to-face'],
        ['BALL_VALVE', 'Ball valve — enter actual face-to-face'],
        ['CHECK_VALVE', 'Check valve — enter actual face-to-face'],
        ['VALVE', 'Other valve — enter actual face-to-face / takeoff'],
        ['CUSTOM', 'Other / custom takeoff'],
      ];
}

function isoFillSelect(select, values, selected) {
  select.innerHTML = '';
  values.forEach(item => {
    let value = Array.isArray(item) ? item[0] : item,
      label = Array.isArray(item) ? item[1] : item;
    select.add(new Option(label, value));
  });
  if ([...select.options].some(option => option.value === selected))
    select.value = selected;
}

function isoAddLeg(preset = {}) {
  isoCounter++;
  let id = isoCounter,
    label = preset.label || isoDefaultLabel(id),
    cc = preset.cc || "8' 0\"",
    direction = preset.direction || (id === 1 ? 'NE' : 'NW');
  $('isoLegs').insertAdjacentHTML(
    'beforeend',
    '<div class="iso-leg" id="isoLeg-' +
      id +
      '" data-id="' +
      id +
      '" data-complete="false" onclick="isoSetActive(' +
      id +
      ')"><div class="iso-leg-head"><h4>ISO Leg <span id="isoHead-' +
      id +
      '">' +
      isoEsc(label) +
      '</span></h4><button onclick="event.stopPropagation();isoRemoveLeg(' +
      id +
      ')">REMOVE</button></div><div class="grid"><label>Leg label<input id="isoLabel-' +
      id +
      '" value="' +
      isoEsc(label) +
      '" oninput="isoLabelChanged(' +
      id +
      ')"></label><label>Draw direction<select id="isoDirection-' +
      id +
      '" onchange="isoDirectionChanged(' +
      id +
      ')"><option value="NW">↖ West</option><option value="NE">↗ North</option><option value="SE">↘ East</option><option value="SW">↙ South</option><option value="UP">↑ Up</option><option value="DOWN">↓ Down</option></select></label><label>Pipe type<select id="isoSystem-' +
      id +
      '" onchange="isoSystemChanged(' +
      id +
      ')"><option value="welded">Welded pipe</option><option value="threaded">Screw / threaded pipe</option></select></label><label>Pipe size<select id="isoSize-' +
      id +
      '" onchange="isoMarkDirty(' +
      id +
      ');isoSetActive(' +
      id +
      ');isoRenderSketch()"></select></label><label>Center-to-center length<input id="isoCC-' +
      id +
      '" value="' +
      isoEsc(cc) +
      '"></label><label>Fitting A<select id="isoFitA-' +
      id +
      '" onchange="isoToggleCustom(' +
      id +
      ')"></select></label><label>Fitting B<select id="isoFitB-' +
      id +
      '" onchange="isoToggleCustom(' +
      id +
      ')"></select></label><label id="isoCustomAWrap-' +
      id +
      '" class="iso-custom hidden">Custom takeoff A<input id="isoCustomA-' +
      id +
      '" placeholder="6\""></label><label id="isoCustomBWrap-' +
      id +
      '" class="iso-custom hidden">Custom takeoff B<input id="isoCustomB-' +
      id +
      '" placeholder="6\""></label></div><div class="actions"><button onclick="event.stopPropagation();isoUseCalc(' +
      id +
      ')">USE MAIN CALC FOR C-C</button><button class="primary" onclick="event.stopPropagation();isoCalcLeg(' +
      id +
      ');isoRenderSketch()">CALCULATE LEG</button></div><div id="isoOut-' +
      id +
      '" class="iso-result muted">Tap this leg to highlight it on the ISO sketch.</div></div>'
  );
  $('isoDirection-' + id).value = direction;
  $('isoSystem-' + id).value = preset.system || 'welded';
  isoSystemChanged(
    id,
    preset.size || '4',
    preset.fitA || 'LR90',
    preset.fitB || 'LR90'
  );
  bindMeasureInput('isoCC-' + id, 'ISO leg ' + label + ' center-to-center');
  bindMeasureInput('isoCustomA-' + id, 'ISO leg ' + label + ' custom takeoff A');
  bindMeasureInput('isoCustomB-' + id, 'ISO leg ' + label + ' custom takeoff B');
  isoSetActive(id);
  return id;
}

function isoGridDirectionForSegment(segment) {
  const viewA = segment.a?.isoDisplayPoint || (typeof isoGridToViewPoint === 'function' ? isoGridToViewPoint(segment.a, 'ISO') : segment.a);
  const viewB = segment.b?.isoDisplayPoint || (typeof isoGridToViewPoint === 'function' ? isoGridToViewPoint(segment.b, 'ISO') : segment.b);
  const dx = viewB.x - viewA.x;
  const dy = viewB.y - viewA.y;
  const length = Math.hypot(dx, dy);
  if (!length) return 'NE';
  // A true screen-vertical ISO grid leg is elevation. Job North never changes UP/DOWN; it only rotates plan compass directions.
  if (Math.abs(dx) < 0.5) return dy < 0 ? 'UP' : 'DOWN';
  const arrow = typeof isoGridCurrent === 'function' ? isoGridCurrent().symbols.find(symbol => symbol.type === 'NORTH_ARROW') : null;
  const northDeg = arrow ? Number(arrow.rotation || 0) : 0;
  const northRad = northDeg * Math.PI / 180;
  const north = { x: Math.sin(northRad), y: -Math.cos(northRad) };
  const east = { x: Math.cos(northRad), y: Math.sin(northRad) };
  const n = (dx * north.x + dy * north.y) / length;
  const e = (dx * east.x + dy * east.y) / length;
  if (Math.abs(n) < 0.38) return e >= 0 ? 'SE' : 'NW';
  if (Math.abs(e) < 0.38) return n >= 0 ? 'NE' : 'SW';
  if (n >= 0 && e >= 0) return 'NE';
  if (n >= 0 && e < 0) return 'NW';
  if (n < 0 && e >= 0) return 'SE';
  return 'SW';
}

function isoGridLegFittingValue(type, system) {
  if (!type) return 'NONE';
  if (['TEE', 'TEE_UP', 'TEE_DOWN'].includes(type)) return system === 'threaded' ? 'Tee' : 'TEE';
  if (['FLANGE', 'WN_FLANGE', 'SO_FLANGE', 'SW_FLANGE', 'BLIND_FLANGE'].includes(type)) return system === 'threaded' ? 'CUSTOM' : 'FLANGE';
  if (type === 'UNION') return system === 'threaded' ? 'UNION' : 'CUSTOM';
  if (type === 'GATE') return system === 'threaded' ? 'VALVE' : 'GATE_VALVE';
  if (type === 'BALL') return system === 'threaded' ? 'VALVE' : 'BALL_VALVE';
  if (type === 'CHECK') return system === 'threaded' ? 'VALVE' : 'CHECK_VALVE';
  if (['GLOBE', 'PLUG', 'BUTTERFLY', 'NEEDLE', 'STRAINER'].includes(type)) return 'VALVE';
  return 'NONE';
}

function isoGridSyncLeg(segment, index, ccText, dimensionType = 'C-C') {
  if (!segment || !$('isoLegs')) return null;
  dimensionType = ['C-C', 'E-E', 'C-F', 'F-F', 'C-E'].includes(dimensionType) ? dimensionType : 'C-C';
  let id = segment.legId;
  let leg = id ? $('isoLeg-' + id) : null;
  let newlyLinked = false;
  if (!leg) {
    const legs = [...document.querySelectorAll('.iso-leg')];
    let reusable = null;
    if (legs.length === 1 && !legs[0].dataset.gridLinked) {
      const candidateId = +legs[0].dataset.id;
      if ($('isoLabel-' + candidateId)?.value === isoDefaultLabel(candidateId) && $('isoCC-' + candidateId)?.value === "8' 0\"") reusable = legs[0];
    }
    if (reusable) id = +reusable.dataset.id;
    else id = isoAddLeg({ label: 'S' + (index + 1), cc: dimensionType === 'C-C' ? ccText : '0\"', direction: isoGridDirectionForSegment(segment), fitA: 'NONE', fitB: 'NONE' });
    segment.legId = id;
    leg = $('isoLeg-' + id);
    newlyLinked = true;
  }
  if (!leg) return null;
  leg.dataset.gridLinked = 'true';
  leg.dataset.gridDimensionType = dimensionType;
  const label = 'S' + (index + 1) + ' [' + dimensionType + ']';
  $('isoLabel-' + id).value = label;
  $('isoHead-' + id).textContent = label;
  if (dimensionType === 'C-C') $('isoCC-' + id).value = ccText;
  else if (newlyLinked) $('isoCC-' + id).value = ''; 
  $('isoDirection-' + id).value = isoGridDirectionForSegment(segment);
  const system = $('isoSystem-' + id).value;
  const fitASelect = $('isoFitA-' + id);
  const fitBSelect = $('isoFitB-' + id);
  if (newlyLinked) {
    if ([...fitASelect.options].some(option => option.value === 'NONE')) fitASelect.value = 'NONE';
    if ([...fitBSelect.options].some(option => option.value === 'NONE')) fitBSelect.value = 'NONE';
  }
  if (segment.startFitType) {
    const fitA = isoGridLegFittingValue(segment.startFitType, system);
    if ([...fitASelect.options].some(option => option.value === fitA)) fitASelect.value = fitA;
  }
  if (segment.endFitType) {
    const fitB = isoGridLegFittingValue(segment.endFitType, system);
    if ([...fitBSelect.options].some(option => option.value === fitB)) fitBSelect.value = fitB;
  }
  $('isoCustomAWrap-' + id).classList.toggle('hidden', isoHasLoadedTakeoff(system, $('isoSize-' + id).value, fitASelect.value));
  $('isoCustomBWrap-' + id).classList.toggle('hidden', isoHasLoadedTakeoff(system, $('isoSize-' + id).value, fitBSelect.value));
  if (dimensionType !== 'C-C') {
    $('isoOut-' + id).innerHTML = '<b>DRAWING DIM ' + isoEsc(dimensionType) + ' ' + isoEsc(ccText) + '</b><br><span class="muted">This label is saved with the ISO. Enter an actual center-to-center value in this Spool Leg before using cut-length math.</span>';
    return id;
  }
  isoCalcLeg(id);
  return id;
}

function isoGridRemoveLinkedLeg(segment) {
  const id = segment?.legId;
  if (!id) return;
  $('isoLeg-' + id)?.remove();
  segment.legId = null;
  if (isoActiveId === id) {
    const remaining = [...document.querySelectorAll('.iso-leg')];
    isoActiveId = remaining.length ? +remaining[remaining.length - 1].dataset.id : null;
  }
}

function isoLabelChanged(id) {
  let label = $('isoLabel-' + id).value || 'LEG';
  $('isoHead-' + id).textContent = label;
  isoMarkDirty(id);
  isoSetActive(id);
  isoRenderSketch();
}

function isoDirectionChanged(id) {
  isoMarkDirty(id);
  isoSetActive(id);
  isoRenderSketch();
}

function isoSystemChanged(id, wantedSize, wantedA, wantedB) {
  isoMarkDirty(id);
  let system = $('isoSystem-' + id).value,
    size = wantedSize || $('isoSize-' + id).value,
    fitA = wantedA || $('isoFitA-' + id).value,
    fitB = wantedB || $('isoFitB-' + id).value;
  isoFillSelect(
    $('isoSize-' + id),
    isoSizes(system),
    size || (system === 'threaded' ? '2' : '4')
  );
  isoFillSelect(
    $('isoFitA-' + id),
    isoFits(system),
    fitA || (system === 'threaded' ? '90 Ell' : 'LR90')
  );
  isoFillSelect(
    $('isoFitB-' + id),
    isoFits(system),
    fitB || (system === 'threaded' ? '90 Ell' : 'LR90')
  );
  isoToggleCustom(id);
  isoSetActive(id);
  isoRenderSketch();
}

function isoHasLoadedTakeoff(system, size, fitting) {
  if (fitting === 'NONE') return true;
  if (fitting === 'CUSTOM') return false;
  return system === 'threaded'
    ? W[fitting]?.[size] != null
    : BW[fitting]?.inch?.[size] != null;
}

function isoToggleCustom(id) {
  isoMarkDirty(id);
  let system = $('isoSystem-' + id).value,
    size = $('isoSize-' + id).value,
    fitA = $('isoFitA-' + id).value,
    fitB = $('isoFitB-' + id).value;
  $('isoCustomAWrap-' + id).classList.toggle(
    'hidden',
    isoHasLoadedTakeoff(system, size, fitA)
  );
  $('isoCustomBWrap-' + id).classList.toggle(
    'hidden',
    isoHasLoadedTakeoff(system, size, fitB)
  );
  isoSetActive(id);
  isoRenderSketch();
}

function isoTakeoff(system, size, fitting, customId) {
  if (fitting === 'NONE') return 0;
  let loaded =
    system === 'threaded' ? W[fitting]?.[size] : BW[fitting]?.inch?.[size];
  if (loaded != null) return loaded;
  let text = $(customId).value.trim(),
    value = literal(text);
  if (!text || !isFinite(value))
    throw Error(
      'Enter the actual manufacturer / project takeoff for ' +
        fitting +
        '. No universal value is loaded.'
    );
  return value;
}

function isoLegData(id) {
  let label = $('isoLabel-' + id).value.trim() || 'LEG',
    system = $('isoSystem-' + id).value,
    size = $('isoSize-' + id).value,
    ccText = $('isoCC-' + id).value.trim(),
    cc = literal(ccText),
    fitA = $('isoFitA-' + id).value,
    fitB = $('isoFitB-' + id).value;
  if (!ccText || !isFinite(cc) || cc < 0)
    throw Error('Enter a valid center-to-center length.');
  let takeA = isoTakeoff(system, size, fitA, 'isoCustomA-' + id),
    takeB = isoTakeoff(system, size, fitB, 'isoCustomB-' + id),
    cut = cc - takeA - takeB;
  if (cut < 0)
    throw Error('Fitting takeoffs are longer than the center-to-center dimension.');
  return {
    id,
    label,
    system,
    size,
    cc,
    fitA,
    fitB,
    takeA,
    takeB,
    cut,
  };
}

function isoCalcLeg(id) {
  try {
    let d = isoLegData(id);
    $('isoOut-' + id).innerHTML =
      '<b class="amber">CUT ' +
      fmtFeet(d.cut) +
      '</b><br><span class="muted">' +
      fmtFeet(d.cc) +
      ' C-C − ' +
      fmtIn(d.takeA) +
      ' A − ' +
      fmtIn(d.takeB) +
      ' B</span>';
    return d;
  } catch (e) {
    $('isoOut-' + id).innerHTML = '<span class="amber">' + isoEsc(e.message) + '</span>';
    return null;
  }
}

function isoCalcAll() {
  let rows = [],
    total = 0;
  document.querySelectorAll('.iso-leg').forEach(el => {
    let d = isoCalcLeg(+el.dataset.id);
    if (d) {
      rows.push(d);
      total += d.cut;
    }
  });
  $('isoCutBody').innerHTML = rows
    .map(
      d =>
        '<tr><td><b>' +
        isoEsc(d.label) +
        '</b></td><td>' +
        (d.system === 'threaded' ? 'Screw' : 'Welded') +
        '</td><td>' +
        d.size +
        '</td><td>' +
        fmtFeet(d.cc) +
        '</td><td>' +
        d.fitA +
        ' (' +
        fmtIn(d.takeA) +
        ')</td><td>' +
        d.fitB +
        ' (' +
        fmtIn(d.takeB) +
        ')</td><td><b class="amber">' +
        fmtFeet(d.cut) +
        '</b></td><td><span class="iso-table-status ' +
        (isoIsComplete(d.id) ? 'built' : '') +
        '">' +
        (isoIsComplete(d.id) ? 'BUILT' : 'OPEN') +
        '</span></td></tr>'
    )
    .join('');
  $('isoSummary').innerHTML = rows.length
    ? '<b>' +
      rows.length +
      ' leg' +
      (rows.length === 1 ? '' : 's') +
      '</b> • Total pipe cut length <b class="amber">' +
      fmtFeet(total) +
      '</b>'
    : 'No valid legs calculated.';
  isoRenderSketch();
}

function isoUseCalc(id) {
  if (cDisplayKind() !== 'measure') {
    $('isoOut-' + id).textContent =
      'Put a FEET or INCH measurement on the main calculator first.';
    return;
  }
  $('isoCC-' + id).value = fmtFeet(cDisplayVal());
  isoMeasurementChanged('isoCC-' + id);
}

function isoMeasurementChanged(inputId) {
  if (['isoGridMeasure', 'isoGridRiseMeasure', 'isoGridRunMeasure'].includes(inputId) && typeof isoGridSaveSegmentInfo === 'function') {
    isoGridSaveSegmentInfo();
    return;
  }
  let match = inputId.match(/-(\d+)$/);
  if (!match) return;
  let id = +match[1];
  isoMarkDirty(id);
  isoSetActive(id);
  isoRenderSketch();
  isoCalcLeg(id);
}

function isoIsComplete(id) {
  return $('isoLeg-' + id)?.dataset.complete === 'true';
}

function isoMarkDirty(id) {
  let el = $('isoLeg-' + id);
  if (!el || el.dataset.complete !== 'true') return;
  el.dataset.complete = 'false';
  el.classList.remove('complete');
}

function isoSetActive(id) {
  isoActiveId = id;
  document.querySelectorAll('.iso-leg').forEach(el => {
    el.classList.toggle('active', +el.dataset.id === id);
    el.classList.toggle('complete', el.dataset.complete === 'true');
  });
  isoUpdateActiveControls();
  isoRenderSketch();
  // Spool section IDs survive tee splits and removals; list position does not.
  // Select the linked pipe on the actual drawing as well as the spool sketch.
  if (typeof isoGridCurrent === 'function' && typeof isoGridSelectSegment === 'function') {
    const index = isoGridCurrent().segments.findIndex(segment => Number(segment.legId) === Number(id));
    if (index >= 0) isoGridSelectSegment(index);
  }
}

function isoEditActive() {
  if (!isoActiveId) return;
  let el = $('isoLeg-' + isoActiveId);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('editing');
  setTimeout(() => el.classList.remove('editing'), 1200);
}

function isoToggleComplete() {
  if (!isoActiveId) return;
  let el = $('isoLeg-' + isoActiveId);
  if (!el) return;
  let next = !isoIsComplete(isoActiveId);
  if (next) {
    let data = isoCalcLeg(isoActiveId);
    if (!data) return;
  }
  el.dataset.complete = String(next);
  el.classList.toggle('complete', next);
  isoCalcAll();
  isoUpdateActiveControls();
}

function isoUpdateActiveControls() {
  let edit = $('isoEditButton'),
    completeButton = $('isoCompleteButton'),
    status = $('isoActiveStatus'),
    badge = $('isoActiveLabel');
  if (!edit || !completeButton || !status || !badge) return;
  let el = isoActiveId ? $('isoLeg-' + isoActiveId) : null;
  if (!el) {
    edit.disabled = true;
    completeButton.disabled = true;
    completeButton.textContent = 'MARK COMPLETE';
    status.textContent = 'Tap a pipe section to work on it.';
    badge.classList.remove('complete');
    return;
  }
  let complete = isoIsComplete(isoActiveId),
    label = $('isoLabel-' + isoActiveId).value.trim() || 'LEG';
  edit.disabled = false;
  completeButton.disabled = false;
  completeButton.textContent = complete ? 'REOPEN SECTION' : 'MARK COMPLETE';
  status.innerHTML = complete
    ? '<b>' + isoEsc(label) + '</b> is BUILT / COMPLETE.'
    : '<b>' + isoEsc(label) + '</b> is selected. Edit it or mark it complete.';
  badge.classList.toggle('complete', complete);
}

function isoDirectionVector(direction) {
  const vectors = {
    E: [120, 0],
    W: [-120, 0],
    NE: [100, -60],
    NW: [-100, -60],
    SE: [100, 60],
    SW: [-100, 60],
    UP: [0, -100],
    DOWN: [0, 100],
  };
  return vectors[direction] || vectors.E;
}

function isoFittingSymbol(fitting, x, y, dx, dy, complete) {
  if (!fitting || fitting === 'NONE') return '';
  let length = Math.hypot(dx, dy) || 1,
    tx = dx / length,
    ty = dy / length,
    nx = -ty,
    ny = tx,
    cls = 'iso-fit-symbol' + (complete ? ' complete' : '');
  if (fitting.includes('90')) {
    return '<path d="M ' + (x - tx * 16) + ' ' + (y - ty * 16) + ' Q ' + x + ' ' + y + ' ' + (x + nx * 16) + ' ' + (y + ny * 16) + '" class="' + cls + '"></path>';
  }
  if (fitting.includes('45')) {
    return '<path d="M ' + (x - tx * 15) + ' ' + (y - ty * 15) + ' L ' + x + ' ' + y + ' L ' + (x + (tx + nx) * 10) + ' ' + (y + (ty + ny) * 10) + '" class="' + cls + '"></path>';
  }
  if (fitting === 'TEE' || fitting === 'Tee') {
    return '<path d="M ' + (x - tx * 14) + ' ' + (y - ty * 14) + ' L ' + (x + tx * 14) + ' ' + (y + ty * 14) + ' M ' + x + ' ' + y + ' L ' + (x + nx * 20) + ' ' + (y + ny * 20) + '" class="' + cls + '"></path>';
  }
  if (fitting === 'REDUCER') {
    return '<path d="M ' + (x - tx * 16 - nx * 8) + ' ' + (y - ty * 16 - ny * 8) + ' L ' + (x + tx * 16 - nx * 4) + ' ' + (y + ty * 16 - ny * 4) + ' M ' + (x - tx * 16 + nx * 8) + ' ' + (y - ty * 16 + ny * 8) + ' L ' + (x + tx * 16 + nx * 4) + ' ' + (y + ty * 16 + ny * 4) + '" class="' + cls + '"></path>';
  }
  if (fitting === 'ECC_REDUCER') {
    return '<path d="M ' + (x - tx * 16 - nx * 8) + ' ' + (y - ty * 16 - ny * 8) + ' L ' + (x + tx * 16 - nx * 8) + ' ' + (y + ty * 16 - ny * 8) + ' M ' + (x - tx * 16 + nx * 8) + ' ' + (y - ty * 16 + ny * 8) + ' L ' + (x + tx * 16 + nx * 3) + ' ' + (y + ty * 16 + ny * 3) + '" class="' + cls + '"></path>';
  }
  if (fitting === 'UNION') {
    return '<polygon points="' + (x - tx * 12 - nx * 9) + ',' + (y - ty * 12 - ny * 9) + ' ' + (x + tx * 12 - nx * 9) + ',' + (y + ty * 12 - ny * 9) + ' ' + (x + tx * 12 + nx * 9) + ',' + (y + ty * 12 + ny * 9) + ' ' + (x - tx * 12 + nx * 9) + ',' + (y - ty * 12 + ny * 9) + '" class="' + cls + '"></polygon>';
  }
  if (fitting === 'COUPLING') {
    return '<path d="M ' + (x - tx * 8 - nx * 11) + ' ' + (y - ty * 8 - ny * 11) + ' L ' + (x - tx * 8 + nx * 11) + ' ' + (y - ty * 8 + ny * 11) + ' M ' + (x + tx * 8 - nx * 11) + ' ' + (y + ty * 8 - ny * 11) + ' L ' + (x + tx * 8 + nx * 11) + ' ' + (y + ty * 8 + ny * 11) + '" class="' + cls + '"></path>';
  }
  if (fitting === 'CAP') {
    return '<line x1="' + (x - nx * 13) + '" y1="' + (y - ny * 13) + '" x2="' + (x + nx * 13) + '" y2="' + (y + ny * 13) + '" class="' + cls + '"></line>';
  }
  if (fitting === 'FLANGE') {
    return '<path d="M ' + (x - tx * 5 - nx * 14) + ' ' + (y - ty * 5 - ny * 14) + ' L ' + (x - tx * 5 + nx * 14) + ' ' + (y - ty * 5 + ny * 14) + ' M ' + (x + tx * 5 - nx * 14) + ' ' + (y + ty * 5 - ny * 14) + ' L ' + (x + tx * 5 + nx * 14) + ' ' + (y + ty * 5 + ny * 14) + '" class="' + cls + '"></path>';
  }
  if (fitting === 'GATE_VALVE' || fitting === 'VALVE') {
    return '<path d="M ' + (x - tx * 16) + ' ' + (y - ty * 16) + ' L ' + (x + nx * 11) + ' ' + (y + ny * 11) + ' L ' + (x + tx * 16) + ' ' + (y + ty * 16) + ' L ' + (x - nx * 11) + ' ' + (y - ny * 11) + ' Z" class="' + cls + '"></path>';
  }
  if (fitting === 'BALL_VALVE') {
    return '<circle cx="' + x + '" cy="' + y + '" r="12" class="' + cls + '"></circle><circle cx="' + x + '" cy="' + y + '" r="4" class="' + cls + '"></circle>';
  }
  if (fitting === 'CHECK_VALVE') {
    return '<path d="M ' + (x - tx * 14 - nx * 10) + ' ' + (y - ty * 14 - ny * 10) + ' L ' + (x + tx * 10) + ' ' + (y + ty * 10) + ' L ' + (x - tx * 14 + nx * 10) + ' ' + (y - ty * 14 + ny * 10) + ' Z M ' + (x + tx * 13 - nx * 11) + ' ' + (y + ty * 13 - ny * 11) + ' L ' + (x + tx * 13 + nx * 11) + ' ' + (y + ty * 13 + ny * 11) + '" class="' + cls + '"></path>';
  }
  if (fitting === 'CUSTOM') {
    return '<polygon points="' + x + ',' + (y - 11) + ' ' + (x + 11) + ',' + y + ' ' + x + ',' + (y + 11) + ' ' + (x - 11) + ',' + y + '" class="' + cls + '"></polygon>';
  }
  return '<circle cx="' + x + '" cy="' + y + '" r="9" class="' + cls + '"></circle>';
}

function isoRenderSketch() {
  let legs = [...document.querySelectorAll('.iso-leg')];
  if (!legs.length) {
    $('isoSketch').innerHTML = '<div class="iso-empty">Add a pipe leg to start the ISO.</div>';
    $('isoActiveLabel').textContent = 'No active leg';
    $('isoActiveInfo').textContent = '';
    isoUpdateActiveControls();
    return;
  }
  let points = [{ x: 80, y: 180 }],
    segments = [];
  legs.forEach(el => {
    let id = +el.dataset.id,
      direction = $('isoDirection-' + id).value,
      vector = isoDirectionVector(direction),
      from = points[points.length - 1],
      to = { x: from.x + vector[0], y: from.y + vector[1] };
    segments.push({ id, from, to });
    points.push(to);
  });
  let minX = Math.min(...points.map(p => p.x)) - 65,
    maxX = Math.max(...points.map(p => p.x)) + 65,
    minY = Math.min(...points.map(p => p.y)) - 90,
    maxY = Math.max(...points.map(p => p.y)) + 90,
    width = Math.max(560, maxX - minX),
    height = Math.max(300, maxY - minY),
    svg = '<g class="iso-compass-svg" transform="translate(' + (minX + 78) + ' ' + (minY + 72) + ')"><rect x="-66" y="-56" width="132" height="108" rx="10" class="iso-axis-box"></rect><text x="0" y="-39" class="iso-axis-title">ISO AXES</text><line x1="0" y1="17" x2="0" y2="-22" class="iso-axis iso-axis-up"></line><polygon points="0,-30 6,-17 0,-21 -6,-17" class="iso-axis-up-tip"></polygon><line x1="0" y1="17" x2="44" y2="42" class="iso-axis iso-axis-right"></line><polygon points="52,47 38,45 43,40 40,34" class="iso-axis-right-tip"></polygon><line x1="0" y1="17" x2="-44" y2="42" class="iso-axis iso-axis-left"></line><polygon points="-52,47 -40,34 -43,40 -38,45" class="iso-axis-left-tip"></polygon><circle cx="0" cy="17" r="4" class="iso-axis-origin"></circle><text x="0" y="-27">UP</text><text x="48" y="51">R 30°</text><text x="-48" y="51">L 30°</text></g>';
  segments.forEach(segment => {
    let id = segment.id,
      active = id === isoActiveId,
      complete = isoIsComplete(id),
      fitA = $('isoFitA-' + id).value,
      fitB = $('isoFitB-' + id).value,
      label = $('isoLabel-' + id).value.trim() || 'LEG',
      system = $('isoSystem-' + id).value,
      size = $('isoSize-' + id).value,
      ccText = $('isoCC-' + id).value.trim() || 'C-C ?',
      mx = (segment.from.x + segment.to.x) / 2,
      my = (segment.from.y + segment.to.y) / 2,
      sdx = segment.to.x - segment.from.x,
      sdy = segment.to.y - segment.from.y,
      slen = Math.hypot(sdx, sdy) || 1,
      dnx = -sdy / slen,
      dny = sdx / slen,
      dimOffset = 28,
      d1x = segment.from.x + dnx * dimOffset,
      d1y = segment.from.y + dny * dimOffset,
      d2x = segment.to.x + dnx * dimOffset,
      d2y = segment.to.y + dny * dimOffset;
    svg +=
      '<g class="iso-segment-group" onclick="isoSetActive(' +
      id +
      ')"><line x1="' + segment.from.x + '" y1="' + segment.from.y + '" x2="' + d1x + '" y2="' + d1y + '" class="iso-dim-witness"></line><line x1="' + segment.to.x + '" y1="' + segment.to.y + '" x2="' + d2x + '" y2="' + d2y + '" class="iso-dim-witness"></line><line x1="' + d1x + '" y1="' + d1y + '" x2="' + d2x + '" y2="' + d2y + '" class="iso-dim-line"></line><line x1="' +
      (segment.from.x + 7) +
      '" y1="' +
      (segment.from.y + 7) +
      '" x2="' +
      (segment.to.x + 7) +
      '" y2="' +
      (segment.to.y + 7) +
      '" class="iso-pipe-shadow"></line><line x1="' +
      segment.from.x +
      '" y1="' +
      segment.from.y +
      '" x2="' +
      segment.to.x +
      '" y2="' +
      segment.to.y +
      '" class="iso-pipe-seg' +
      (active ? ' active' : '') +
      (complete ? ' complete' : '') +
      '"></line><line x1="' +
      (segment.from.x - 3) +
      '" y1="' +
      (segment.from.y - 3) +
      '" x2="' +
      (segment.to.x - 3) +
      '" y2="' +
      (segment.to.y - 3) +
      '" class="iso-pipe-shine"></line><circle cx="' +
      segment.from.x +
      '" cy="' +
      segment.from.y +
      '" r="6" class="iso-node"></circle><circle cx="' +
      segment.to.x +
      '" cy="' +
      segment.to.y +
      '" r="6" class="iso-node"></circle>' +
      isoFittingSymbol(fitA, segment.from.x, segment.from.y, segment.to.x - segment.from.x, segment.to.y - segment.from.y, complete) +
      isoFittingSymbol(fitB, segment.to.x, segment.to.y, segment.from.x - segment.to.x, segment.from.y - segment.to.y, complete) +
      '<text x="' +
      mx +
      '" y="' +
      (my - 15) +
      '" class="iso-seg-label">' +
      isoEsc(label) +
      ' • ' +
      isoEsc(size) +
      '&quot; ' +
      (system === 'threaded' ? 'SCREW' : 'WELD') +
      '</text><text x="' +
      mx +
      '" y="' +
      (my + 3) +
      '" class="iso-dim-label">C-C ' +
      isoEsc(ccText) +
      '</text></g>';
  });
  $('isoSketch').innerHTML =
    '<svg viewBox="' +
    minX +
    ' ' +
    minY +
    ' ' +
    width +
    ' ' +
    height +
    '" aria-label="Pipe isometric sketch">' +
    svg +
    '</svg>';
  let activeEl = $('isoLeg-' + isoActiveId);
  if (activeEl) {
    let label = $('isoLabel-' + isoActiveId).value.trim() || 'LEG',
      size = $('isoSize-' + isoActiveId).value,
      system = $('isoSystem-' + isoActiveId).value,
      cc = $('isoCC-' + isoActiveId).value.trim();
    $('isoActiveLabel').textContent = 'WORKING ON: ' + label;
    let details =
      size +
      '" ' +
      (system === 'threaded' ? 'SCREW PIPE' : 'WELDED PIPE') +
      ' • C-C ' +
      cc;
    try {
      let d = isoLegData(isoActiveId);
      details += ' • CUT ' + fmtFeet(d.cut);
    } catch {}
    $('isoActiveInfo').textContent = details;
  }
  isoUpdateActiveControls();
}

function isoRemoveLeg(id) {
  $('isoLeg-' + id)?.remove();
  let remaining = [...document.querySelectorAll('.iso-leg')];
  isoActiveId = remaining.length ? +remaining[remaining.length - 1].dataset.id : null;
  isoCalcAll();
  isoRenderSketch();
}

function isoClear() {
  $('isoLegs').innerHTML = '';
  $('isoCutBody').innerHTML = '';
  $('isoSummary').textContent = 'Add a leg and calculate the spool.';
  isoCounter = 0;
  isoActiveId = null;
  isoAddLeg({ direction: 'NE' });
}

function isoSaveMeta() {
  try {
    localStorage.pf_iso_meta = JSON.stringify({
      number: $('isoNumber').value,
      line: $('isoLine').value,
      service: $('isoService').value,
      mainSize: $('isoMainSize').value,
      material: $('isoMaterial').value,
      notes: $('isoNotes').value,
    });
  } catch {}
}

function isoLoadMeta() {
  try {
    let meta = JSON.parse(localStorage.pf_iso_meta || '{}');
    $('isoNumber').value = meta.number || '';
    $('isoLine').value = meta.line || '';
    $('isoService').value = meta.service || '';
    $('isoMainSize').value = meta.mainSize || '';
    $('isoMaterial').value = meta.material || '';
    $('isoNotes').value = meta.notes || '';
  } catch {}
}
