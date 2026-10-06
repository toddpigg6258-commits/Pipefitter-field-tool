function fillBwSizes() {
  let type = $('bwtype').value,
    data = type === 'RED' ? RED : BW[type].inch,
    old = $('bwsize').value;
  $('bwsize').innerHTML = '';
  orderedPipeSizes(Object.keys(data)).forEach(k => $('bwsize').add(new Option(k, k)));
  if (data[old]) $('bwsize').value = old;
}

function bwTypeChanged() {
  fillBwSizes();
  $('bwsmallWrap').classList.toggle('hidden', $('bwtype').value !== 'RED');
  bwSizeChanged();
}

function bwSizeChanged() {
  if ($('bwtype').value === 'RED') {
    let item = RED[$('bwsize').value];
    $('bwsmall').innerHTML = '';
    (item?.small || []).forEach(k => $('bwsmall').add(new Option(k, k)));
  }
  bwCalc();
}

function bwCalc() {
  let type = $('bwtype').value,
    size = $('bwsize').value;
  if (type === 'RED') {
    let item = RED[size];
    if (!item) return;
    result('bwOut', [
      [
        'Reducer ' + size + ' × ' + $('bwsmall').value,
        '<span class="weld-dim">' + fmtIn(item.inch) + '</span>',
      ],
      ['Dimension', 'Overall length H'],
      ['Reference', 'ASME B16.9-2024'],
    ]);
    return;
  }
  let item = BW[type],
    value = item?.inch?.[size];
  if (value == null) return;
  result('bwOut', [
    [size + ' ' + item.label, '<span class="weld-dim">' + fmtIn(value) + '</span>'],
    ['Reference', 'ASME B16.9-2024'],
  ]);
}

const B16_11_SIZES = [
  '1/8',
  '1/4',
  '3/8',
  '1/2',
  '3/4',
  '1',
  '1-1/4',
  '1-1/2',
  '2',
  '2-1/2',
  '3',
  '4',
];

const SOCKET_WELD_FITTINGS = [
  '90° Elbow',
  '45° Elbow',
  'Tee',
  'Cross',
  'Full Coupling',
  'Half Coupling',
  'Union',
  'Cap',
];

const SOCKET_COMMON = {
  3000: {
    '90° Elbow': { '1/2': 0.625, '3/4': 0.75, 1: 0.875, '1-1/4': 1.0625, '1-1/2': 1.25, 2: 1.5 },
    Tee: { '1/2': 0.625, '3/4': 0.75, 1: 0.875, '1-1/4': 1.0625, '1-1/2': 1.25, 2: 1.5 },
    Cross: { '1/2': 0.625, '3/4': 0.75, 1: 0.875, '1-1/4': 1.0625, '1-1/2': 1.25, 2: 1.5 },
    '45° Elbow': { '1/2': 0.4375, '3/4': 0.5, 1: 0.5625, '1-1/4': 0.6875, '1-1/2': 0.8125, 2: 1.0 },
  },
  6000: {
    '90° Elbow': { '1/2': 0.75, '3/4': 0.875, 1: 1.0625, '1-1/4': 1.25, '1-1/2': 1.5, 2: 1.625 },
    Tee: { '1/2': 0.75, '3/4': 0.875, 1: 1.0625, '1-1/4': 1.25, '1-1/2': 1.5, 2: 1.625 },
    Cross: { '1/2': 0.75, '3/4': 0.875, 1: 1.0625, '1-1/4': 1.25, '1-1/2': 1.5, 2: 1.625 },
    '45° Elbow': { '1/2': 0.5, '3/4': 0.5625, 1: 0.6875, '1-1/4': 0.8125, '1-1/2': 1.0, 2: 1.125 },
  },
};

const THREADED_FITTINGS = [
  '90 Ell',
  '45 Ell',
  'Tee',
  'Cross',
  'Street 90',
  'Street 45',
  'Full Coupling',
  'Half Coupling',
  'Union',
  'Cap',
  'Plug',
  'Hex Bushing',
  'Reducer Coupling',
  'Gate Valve',
  'Ball Valve',
  'Globe Valve',
  'Check Valve',
];

function initSocketWeld() {
  $('swt').innerHTML = '';
  SOCKET_WELD_FITTINGS.forEach(name => $('swt').add(new Option(name, name)));
  $('sws').innerHTML = '';
  B16_11_SIZES.forEach(size => $('sws').add(new Option(size, size)));
  $('sws').value = '1';
  socketCalc();
}

function socketCalc() {
  let type = $('swt').value,
    size = $('sws').value,
    pressureClass = $('swclass').value,
    value = SOCKET_COMMON[pressureClass]?.[type]?.[size];
  if (value != null) {
    result('swOut', [
      ['Takeoff', '<span class="weld-dim">' + fmtIn(value) + '</span>'],
      ['Dimension', 'Center-to-bottom of socket'],
      ['Reference', 'Common ASME B16.11 dimension • Class ' + pressureClass],
      ['Cross-check', 'Bonney Forge / Merit Brass dimensional family'],
    ]);
    return;
  }
  $('swOut').innerHTML =
    '<div><b>' + size + '&quot; ' + type + '</b></div>' +
    '<div class="amber" style="margin-top:6px"><b>Actual fitting takeoff required.</b></div>' +
    '<div class="muted" style="margin-top:6px">No common cross-checked value is loaded for this class / fitting / size. Use the actual manufacturer fitting instead of guessing.</div>' +
    '<button class="mini" style="margin-top:9px" onclick="socketToCustom()">ENTER ACTUAL TAKEOFF</button>';
}

function socketToCustom() {
  prepareCustomTakeoff(
    'Socket Weld ' + $('swt').value,
    $('sws').value,
    'Class ' + $('swclass').value
  );
}

function initThreadedFittings() {
  $('wt').innerHTML = '';
  THREADED_FITTINGS.forEach(name => $('wt').add(new Option(name, name)));
  threadedTypeChanged();
}

function threadedTypeChanged() {
  let type = $('wt').value,
    sizes = W[type] ? orderedPipeSizes(Object.keys(W[type])) : B16_11_SIZES;
  $('ws').innerHTML = '';
  sizes.forEach(size => $('ws').add(new Option(size, size)));
  if (sizes.includes('1')) $('ws').value = '1';
  wardCalc();
}

function wardCalc() {
  let type = $('wt').value,
    size = $('ws').value,
    table = W[type];
  if (!table || table[size] == null) {
    $('wardOut').innerHTML =
      '<div><b>' +
      size +
      '&quot; ' +
      type +
      '</b></div><div class="amber" style="margin-top:6px"><b>No universal takeout is loaded for this fitting.</b></div><div class="muted" style="margin-top:6px">Threaded fitting dimensions depend on the actual manufacturer, class and pattern. Enter the fitting used on your job instead of guessing.</div><button class="mini" style="margin-top:9px" onclick="threadedToCustom()">ENTER ACTUAL TAKEOUT</button>';
    return;
  }
  result('wardOut', [
    ['Takeout', '<span class="weld-dim">' + fmtIn(table[size]) + '</span>'],
    ['Applies to', 'Loaded Ward Class 150 starter table'],
    ['Field check', 'Verify actual manufacturer / fitting pattern before cutting'],
  ]);
}

function threadedToCustom() {
  prepareCustomTakeoff('Threaded ' + $('wt').value, $('ws').value, 'Actual maker / class');
}

const GROOVE_DATA = {
  victaulic: {
    label: 'Victaulic',
    fittings: {
      'No. 10 • 90° Standard Elbow': { '3/4': 2.25, 1: 2.25, '1-1/4': 2.75, '1-1/2': 2.75, 2: 3.25, '2-1/2': 3.75, 3: 4.25, 4: 5, 5: 5.5, 6: 6.5, 8: 7.75, 10: 9, 12: 10 },
      'No. 11 • 45° Standard Elbow': { '3/4': 1.5, 1: 1.75, '1-1/4': 1.75, '1-1/2': 1.75, 2: 2, '2-1/2': 2.25, 3: 2.5, 4: 3, 5: 3.25, 6: 3.5, 8: 4.25, 10: 4.75, 12: 5.25 },
      'No. 20 • Straight Tee': { '3/4': 2.25, 1: 2.25, '1-1/4': 2.75, '1-1/2': 2.75, 2: 3.25, '2-1/2': 3.75, 3: 4.25, 4: 5, 5: 5.5, 6: 6.5, 8: 7.75, 10: 9, 12: 10 },
      'No. 100-5D • 90° Long Radius Elbow': { 2: 14, '2-1/2': 16.5, 3: 19, '3-1/2': 21.5, 4: 24, '4-1/2': 27, 5: 30, 6: 36, 8: 48, 10: 60, 12: 72 },
      'No. 50 • Concentric Reducer': { '3 x 1': 2.5, '3 x 1-1/4': 2.5, '3 x 1-1/2': 2.5, '4 x 1': 3, '4 x 1-1/2': 3, '4 x 2': 3, '4 x 2-1/2': 3, '4 x 3': 3, '4 x 3-1/2': 3, '6 x 1': 4, '6 x 2': 4, '6 x 2-1/2': 4 },
    },
  },
  gruvlok: {
    label: 'Gruvlok',
    fittings: {
      'Fig. 7050 • 90° Standard Elbow': { 1: 2.25, '1-1/4': 2.75, '1-1/2': 2.75, 2: 3.25, '2-1/2': 3.75, 3: 4.25, 4: 5, 5: 5.5, 6: 6.5, 8: 7.75, 10: 9, 12: 10 },
      'Fig. 7051 • 45° Standard Elbow': { 1: 1.75, '1-1/4': 1.75, '1-1/2': 1.75, 2: 2, '2-1/2': 2.25, 3: 2.5, 4: 3, 5: 3.25, 6: 3.5, 8: 4.25, 10: 4.75, 12: 5.25 },
      'Fig. 7060 • Straight Tee': { 1: 2.25, '1-1/4': 2.75, '1-1/2': 2.75, 2: 3.25, '2-1/2': 3.75, 3: 4.25, 4: 5, 5: 5.5, 6: 6.5, 8: 7.75, 10: 9, 12: 10 },
      'Fig. 7050-5D • 90° Long Radius Elbow': { 2: 14, '2-1/2': 16.5, 3: 19, '3-1/2': 21.5, 4: 24, 5: 30, 6: 36, 8: 48, 10: 60, 12: 72, 14: 84, 16: 96 },
      'Fig. 7072 • Concentric Reducer': { '1-1/4 x 1': 2.5, '1-1/2 x 1': 2.5, '1-1/2 x 1-1/4': 2.5, '2 x 1': 2.5, '2 x 1-1/4': 2.5, '2 x 1-1/2': 2.5, '2-1/2 x 1': 2.5, '2-1/2 x 1-1/4': 2.5, '2-1/2 x 1-1/2': 2.5, '2-1/2 x 2': 2.5, '3 x 1': 2.5, '3 x 1-1/4': 2.5, '3 x 1-1/2': 2.5, '3 x 2': 2.5, '3 x 2-1/2': 2.5, '3-1/2 x 3': 3, '4 x 1': 3, '4 x 1-1/4': 3, '4 x 1-1/2': 3, '4 x 2': 3, '4 x 2-1/2': 3, '4 x 3': 3, '4 x 3-1/2': 3, '5 x 2': 3.5, '5 x 2-1/2': 3.5, '5 x 3': 3.5, '5 x 4': 3.5, '6 x 1': 4, '6 x 1-1/2': 4, '6 x 2': 4, '6 x 2-1/2': 4, '6 x 3': 4, '6 x 4': 4, '6 x 5': 4, '8 x 3': 5, '8 x 4': 5, '8 x 5': 5, '8 x 6': 5, '10 x 4': 6, '10 x 5': 6, '10 x 6': 6, '10 x 8': 6, '12 x 4': 7, '12 x 6': 7, '12 x 8': 7, '12 x 10': 7 },
    },
  },
};

function initGroovedFittings() {
  grooveBrandChanged();
}

function grooveBrandChanged() {
  let data = GROOVE_DATA[$('grBrand').value];
  $('grFit').innerHTML = '';
  Object.keys(data.fittings).forEach(name => $('grFit').add(new Option(name, name)));
  grooveFitChanged();
}

function grooveFitChanged() {
  let data = GROOVE_DATA[$('grBrand').value],
    table = data.fittings[$('grFit').value];
  $('grSize').innerHTML = '';
  orderedPipeSizes(Object.keys(table || {})).forEach(size => $('grSize').add(new Option(size, size)));
  if ([...$('grSize').options].some(option => option.value === '4')) $('grSize').value = '4';
  grooveCalc();
}

function grooveCalc() {
  let brand = GROOVE_DATA[$('grBrand').value],
    fitting = $('grFit').value,
    size = $('grSize').value,
    value = brand.fittings[fitting]?.[size];
  if (value == null) return;
  let isReducer = fitting.includes('Reducer'),
    source = brand.label === 'Victaulic'
      ? (fitting.includes('100-5D') ? 'Victaulic publication 07.02' : 'Victaulic Grooved End Fittings publication 07.01')
      : (fitting.includes('7050-5D') ? 'ASC Gruvlok Fig. 7050-5D submittal' : fitting.includes('7072') ? 'ASC Gruvlok Fig. 7072 / Pipe Fitters Handbook' : 'ASC Gruvlok fitting submittal');
  result('grOut', [
    [isReducer ? 'End-to-end' : 'Center-to-end', '<span class="weld-dim">' + fmtIn(value) + '</span>'],
    ['Brand', brand.label],
    ['Product', fitting],
    ['Size', size + '&quot;'],
    ['Source', source],
    ['Field check', 'Verify the actual product figure / catalog revision when tolerance matters'],
  ]);
}

function prepareCustomTakeoff(type, size, maker) {
  $('ctype').value = type || '';
  $('csize').value = size || '';
  $('cmaker').value = maker || '';
  $('cdim').value = '';
  $('customTakeoffCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => $('cdim').focus(), 250);
}

function takes() {
  try {
    return JSON.parse(localStorage.pf_custom || '[]');
  } catch {
    return [];
  }
}

function saveTake() {
  if (!$('ctype').value || !$('csize').value || !$('cdim').value) return;
  let a = takes();
  a.unshift({
    t: $('ctype').value,
    s: $('csize').value,
    d: $('cdim').value,
    m: $('cmaker').value,
  });
  localStorage.pf_custom = JSON.stringify(a);
  renderTakes();
}

function delTake(i) {
  let a = takes();
  a.splice(i, 1);
  localStorage.pf_custom = JSON.stringify(a);
  renderTakes();
}

function renderTakes() {
  let a = takes();
  $('takeList').innerHTML = a.length
    ? a
        .map(
          (x, i) =>
            '<div class="take"><div><b>' +
            x.s +
            ' ' +
            x.t +
            '</b><div class="muted">' +
            (x.m || '') +
            '</div></div><div><b>' +
            x.d +
            '</b> <button onclick="delTake(' +
            i +
            ')">×</button></div></div>'
        )
        .join('')
    : '<p class="muted">No custom takeoffs saved yet.</p>';
}
