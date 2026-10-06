function fillInputFromCalc(id) {
  $(id).value =
    cDisplayKind() === 'measure'
      ? fmtFeet(cDisplayVal())
      : cFormatNumber(cDisplayVal());
  afterMeasurementApplied(id);
}
function valMeasure(id) {
  let s = $(id).value.trim();
  if (!s) return null;
  let v = literal(s);
  if (!isFinite(v)) throw Error('Check measurement');
  return v;
}
function valAngle(id) {
  let s = $(id).value.trim();
  if (!s) return null;
  let v = parseFloat(s);
  if (!(v > 0 && v < 90)) throw Error('Angle must be between 0° and 90°');
  return v;
}
let measureTarget = null;
const fixedMeasureInputs = {
  off: 'Offset',
  rv: 'Vertical / rise',
  rh: 'Horizontal / run',
  ctc: 'Center-to-center',
  ta: 'Takeoff A',
  tb: 'Takeoff B',
  gap: 'Extra cutback allowance',
  cdim: 'Fitting / valve dimension',
};
function bindMeasureInput(id, title) {
  let el = $(id);
  if (!el || el.dataset.measureBound) return;
  el.dataset.measureBound = '1';
  el.readOnly = true;
  el.inputMode = 'none';
  el.classList.add('measure-tap-input');
  el.title = 'Tap to enter feet, inches and fraction';
  el.addEventListener('click', e => {
    e.preventDefault();
    el.blur();
    openMeasurePad(id, title);
  });
  el.addEventListener('focus', () => {
    if ($('measurePadOverlay').classList.contains('hidden')) {
      el.blur();
      openMeasurePad(id, title);
    }
  });
}
function bindMeasureInputs() {
  Object.entries(fixedMeasureInputs).forEach(([id, title]) =>
    bindMeasureInput(id, title)
  );
}
function loadMeasurePadValue(v) {
  let f = 0,
    inch = 0,
    num = 0,
    d = 16;
  if (isFinite(v)) {
    v = Math.abs(v);
    f = Math.floor(v / 12);
    let rem = v - f * 12;
    inch = Math.floor(rem + 1e-9);
    num = Math.round((rem - inch) * d);
    if (num === d) {
      inch++;
      num = 0;
    }
    if (num) {
      let g = gcd(num, d);
      num /= g;
      d /= g;
    }
  }
  $('mpFeet').value = f || '';
  $('mpInches').value = inch || '';
  $('mpNum').value = num || '';
  $('mpDen').value = num ? d : '';
  updateMeasurePreview();
}
function openMeasurePad(id, title) {
  measureTarget = id;
  $('measurePadTitle').textContent = title + ' measurement';
  let raw = $(id).value.trim(),
    v = raw ? literal(raw) : NaN;
  loadMeasurePadValue(v);
  $('measurePadOverlay').classList.remove('hidden');
}
function measureUseMainCalc() {
  if (cDisplayKind() !== 'measure') {
    $('measurePreview').textContent = 'Main calculator needs a FEET or INCH measurement first';
    return;
  }
  loadMeasurePadValue(cDisplayVal());
}
function closeMeasurePad() {
  $('measurePadOverlay').classList.add('hidden');
  measureTarget = null;
}
function measureOverlayClick(e) {
  if (e.target === $('measurePadOverlay')) closeMeasurePad();
}
function measurePadValue() {
  let ft = parseFloat($('mpFeet').value) || 0,
    inch = parseFloat($('mpInches').value) || 0,
    n = parseFloat($('mpNum').value) || 0,
    d = parseFloat($('mpDen').value) || 0;
  if (n && !(d > 0)) return NaN;
  return ft * 12 + inch + (n ? n / d : 0);
}
function updateMeasurePreview() {
  let v = measurePadValue();
  $('measurePreview').textContent = isFinite(v)
    ? fmtFeet(v)
    : 'Enter fraction bottom number';
}
function setMeasureFrac(n, d) {
  $('mpNum').value = n || '';
  $('mpDen').value = n ? d : '';
  updateMeasurePreview();
}
function clearMeasurePad() {
  ['mpFeet', 'mpInches', 'mpNum', 'mpDen'].forEach(id => ($(id).value = ''));
  updateMeasurePreview();
}
function updateTriangleDisplays() {
  ['triRise', 'triRun', 'triTravel'].forEach(id => {
    $(id + 'Display').textContent = $(id).value.trim() || 'Tap to enter';
  });
}
function afterMeasurementApplied(id) {
  if (['triRise', 'triRun', 'triTravel'].includes(id)) {
    updateTriangleDisplays();
    let filled = ['triRise', 'triRun', 'triTravel', 'triAngle'].filter(key =>
      $(key).value.trim()
    ).length;
    if (filled >= 2) solveTriangle();
    return;
  }
  if (id === 'off') offsetCalc();
  if (id === 'rv' || id === 'rh') rollCalc();
  if (id === 'ctc' || id === 'ta' || id === 'tb') spoolCalc();
  if (id === 'gap') saddleCalc();
  if (['isoGridMeasure', 'isoGridRiseMeasure', 'isoGridRunMeasure'].includes(id) && typeof isoGridSaveSegmentInfo === 'function') {
    isoGridSaveSegmentInfo();
    return;
  }
  if (id.startsWith('iso') && typeof isoMeasurementChanged === 'function') isoMeasurementChanged(id);
}
function applyMeasurePad() {
  if (!measureTarget) return;
  let id = measureTarget,
    v = measurePadValue();
  if (!isFinite(v)) return;
  $(id).value = fmtFeet(v);
  closeMeasurePad();
  afterMeasurementApplied(id);
}
function clearTriangle() {
  ['triRise', 'triRun', 'triTravel', 'triAngle'].forEach(
    id => ($(id).value = '')
  );
  updateTriangleDisplays();
  $('triOut').innerHTML = 'Enter any two values.';
}
function cTriangleKey(kind) {
  let v = cDisplayVal();
  if (kind === 'angle') $('triAngle').value = Math.abs(v).toFixed(2);
  else {
    let id = { rise: 'triRise', run: 'triRun', travel: 'triTravel' }[kind];
    $(id).value = fmtFeet(v);
  }
  updateTriangleDisplays();
  if (
    ['triRise', 'triRun', 'triTravel', 'triAngle'].filter(id =>
      $(id).value.trim()
    ).length >= 2
  )
    solveTriangle();
}
function solveTriangle() {
  try {
    let rise = valMeasure('triRise'),
      run = valMeasure('triRun'),
      travel = valMeasure('triTravel'),
      angle = valAngle('triAngle');
    let have = [rise, run, travel, angle].filter(v => v !== null).length;
    if (have < 2) throw Error('Enter any two values.');
    if (rise !== null && run !== null) {
      travel = Math.hypot(rise, run);
      angle = (Math.atan2(rise, run) * 180) / Math.PI;
    } else if (rise !== null && travel !== null) {
      run = Math.sqrt(travel * travel - rise * rise);
      angle = (Math.asin(rise / travel) * 180) / Math.PI;
    } else if (run !== null && travel !== null) {
      rise = Math.sqrt(travel * travel - run * run);
      angle = (Math.acos(run / travel) * 180) / Math.PI;
    } else if (rise !== null && angle !== null) {
      let a = (angle * Math.PI) / 180;
      run = rise / Math.tan(a);
      travel = rise / Math.sin(a);
    } else if (run !== null && angle !== null) {
      let a = (angle * Math.PI) / 180;
      rise = run * Math.tan(a);
      travel = run / Math.cos(a);
    } else if (travel !== null && angle !== null) {
      let a = (angle * Math.PI) / 180;
      rise = travel * Math.sin(a);
      run = travel * Math.cos(a);
    }
    $('triRise').value = fmtFeet(rise);
    $('triRun').value = fmtFeet(run);
    $('triTravel').value = fmtFeet(travel);
    $('triAngle').value = angle.toFixed(2);
    updateTriangleDisplays();
    result('triOut', [
      ['Rise', fmtFeet(rise)],
      ['Run', fmtFeet(run)],
      ['Travel', fmtFeet(travel)],
      ['Angle', angle.toFixed(2) + '°'],
    ]);
  } catch (e) {
    $('triOut').textContent = e.message;
  }
}
function len(id) {
  let x = literal($(id).value);
  if (!isFinite(x)) throw Error('Check measurement entry');
  return x;
}
function offsetCalc() {
  try {
    let o = len('off'),
      a = (+$('oa').value * Math.PI) / 180;
    result('offOut', [
      ['Offset', fmtFeet(o)],
      ['Travel', '<span class="big">' + fmtFeet(o / Math.sin(a)) + '</span>'],
      ['Setback / Advance', fmtFeet(o / Math.tan(a))],
      ['Field read', 'OFFSET is centerline change • TRAVEL is diagonal pipe • SETBACK / ADVANCE is straight run'],
    ]);
  } catch (e) {
    $('offOut').textContent = e.message;
  }
}
function rollCalc() {
  try {
    let vertical = len('rv'),
      horizontal = len('rh'),
      trueOffset = Math.hypot(vertical, horizontal),
      a = (+$('ra').value * Math.PI) / 180,
      rollAngle = Math.atan2(Math.abs(vertical), Math.abs(horizontal || 0)) * 180 / Math.PI,
      travel = trueOffset / Math.sin(a),
      run = trueOffset / Math.tan(a);
    result('rollOut', [
      ['V — Vertical Offset', fmtFeet(vertical)],
      ['H — Horizontal Offset', fmtFeet(horizontal)],
      ['x — True Offset', '<span class="big">' + fmtFeet(trueOffset) + '</span>'],
      ['T — Travel', fmtFeet(travel)],
      ['R — Run Between Angles', fmtFeet(run)],
      ['Roll Orientation', rollAngle.toFixed(2) + '° from H toward V'],
      ['Field sequence', '1) V + H → x • 2) x + fitting angle → T and R'],
    ]);
  } catch (e) {
    $('rollOut').textContent = e.message;
  }
}
function spoolCalc() {
  try {
    let x = len('ctc') - len('ta') - len('tb');
    result('spoolOut', [
      ['Cut length', '<span class="big">' + fmtFeet(x) + '</span>'],
      ['Decimal inches', x.toFixed(4)],
    ]);
  } catch (e) {
    $('spoolOut').textContent = e.message;
  }
}

function selectSectionTab(group, panel, button) {
  document.querySelectorAll('[data-subtab-group="' + group + '"][data-subtab-panel]').forEach(item => {
    item.classList.toggle('hidden', item.dataset.subtabPanel !== panel);
  });
  document.querySelectorAll('[data-subtab-button-group="' + group + '"]').forEach(item => {
    item.classList.toggle('on', item.dataset.subtabButtonPanel === panel);
  });
  if (button) button.classList.add('on');
}

function selectToolsOffsetTab(panel, button) {
  const root = document.querySelector('.tools-offset-panel');
  if (!root) return;
  root.querySelectorAll('[data-offset-tool]').forEach(item => {
    item.classList.toggle('hidden', item.dataset.offsetTool !== panel);
  });
  root.querySelectorAll('[data-offset-tab]').forEach(item => {
    item.classList.toggle('on', item.dataset.offsetTab === panel);
  });
  if (button) button.classList.add('on');
}
