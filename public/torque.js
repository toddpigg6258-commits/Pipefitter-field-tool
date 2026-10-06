function boltSequencePositions(n) {
  const known = {
    4: [0, 2, 1, 3],
    8: [0, 4, 2, 6, 1, 5, 3, 7],
    12: [0, 6, 3, 9, 1, 7, 4, 10, 2, 8, 5, 11],
    16: [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15],
  };
  return known[n];
}

function boltClockPosition(position, n) {
  let totalMinutes = Math.round((position * 720) / n),
    hour = Math.floor(totalMinutes / 60) % 12,
    minute = totalMinutes % 60;
  if (hour === 0) hour = 12;
  return hour + ':' + String(minute).padStart(2, '0');
}

function boltPositionName(position, n) {
  let clock = boltClockPosition(position, n);
  const names = {
    '12:00': 'TOP',
    '3:00': 'RIGHT',
    '6:00': 'BOTTOM',
    '9:00': 'LEFT',
  };
  return names[clock] ? names[clock] + ' • ' + clock : clock;
}

function parseBoltFractionToken(token) {
  const parts = String(token || '').replace('-', ' ').trim().split(/\s+/);
  if (!parts[0]) return NaN;
  const fraction = value => {
    if (!String(value).includes('/')) return Number(value);
    const pieces = String(value).split('/').map(Number);
    return pieces.length === 2 && pieces[1] ? pieces[0] / pieces[1] : NaN;
  };
  if (parts.length === 1) return fraction(parts[0]);
  return Number(parts[0]) + fraction(parts[1]);
}

const STANDARD_HEX_WRENCH = {
  5: 0.5,
  6: 0.5625,
  7: 0.625,
  8: 0.75,
  9: 0.8125,
  10: 0.9375,
  12: 1.125,
  14: 1.3125,
  16: 1.5,
  18: 1.6875,
  20: 1.875,
  22: 2.0625,
  24: 2.25,
};

const HEAVY_HEX_WRENCH = {
  5: 0.5625,
  6: 0.6875,
  7: 0.75,
  8: 0.875,
  9: 0.9375,
  10: 1.0625,
  12: 1.25,
  14: 1.4375,
  16: 1.625,
  18: 1.8125,
  20: 2,
  22: 2.1875,
  24: 2.375,
};

function nearestSixteenth(value) {
  return Math.round(value * 16) / 16;
}

function boltWrenchPair(boltSize) {
  const numerator = Math.round(boltSize * 16);
  const commonStandard = STANDARD_HEX_WRENCH[numerator];
  const commonHeavy = HEAVY_HEX_WRENCH[numerator];
  return {
    standard: commonStandard || nearestSixteenth(1.5 * boltSize),
    heavy: commonHeavy || nearestSixteenth(1.5 * boltSize + 0.125),
    standardCalculated: !commonStandard,
    heavyCalculated: !commonHeavy,
  };
}

function flangeWrenchesFromBolting(bolting) {
  const match = String(bolting || '').match(/×\s*([0-9]+(?:[- ]\d+\/\d+|\/\d+)?)/);
  if (!match) return null;
  const boltSize = parseBoltFractionToken(match[1]);
  if (!(boltSize > 0)) return null;
  return boltWrenchPair(boltSize);
}

function addFlangeWrenchRows(rows, bolting) {
  const pair = flangeWrenchesFromBolting(bolting);
  if (!pair) return rows;
  rows.push(['Standard hex wrench', '<span class="big">' + fmtIn(pair.standard, 16) + '</span>']);
  rows.push(['Extra heavy / heavy hex wrench', '<span class="big">' + fmtIn(pair.heavy, 16) + '</span>']);
  return rows;
}

function renderFlangeWrenchTable() {
  const body = $('flangeWrenchBody');
  if (!body) return;
  const rows = [];
  for (let numerator = 5; numerator <= 24; numerator++) {
    const boltSize = numerator / 16;
    const pair = boltWrenchPair(boltSize);
    const standardNote = pair.standardCalculated ? '<small>calc / verify</small>' : '<small>standard nominal</small>';
    const heavyNote = pair.heavyCalculated ? '<small>calc / verify</small>' : '<small>heavy-hex nominal</small>';
    rows.push(
      '<tr><td><b>' + fmtIn(boltSize, 16) + '</b></td>' +
      '<td><b>' + fmtIn(pair.standard, 16) + '</b>' + standardNote + '</td>' +
      '<td><b>' + fmtIn(pair.heavy, 16) + '</b>' + heavyNote + '</td></tr>'
    );
  }
  body.innerHTML = rows.join('');
}

function renderBoltPattern() {
  let n = +$('boltCount').value,
    order = boltSequencePositions(n),
    labelByPosition = Array(n);
  order.forEach((position, index) => {
    labelByPosition[position] = index + 1;
  });
  let clockwiseLabels = labelByPosition.join(', '),
    cards = labelByPosition
      .map(number => '<div class="bolt-clock-card"><div class="bolt-clock-num">' + number + '</div></div>')
      .join('');
  $('boltPatternWrap').innerHTML =
    '<div class="pattern-box"><div class="bolt-clock-rule"><b>START AT ANY BOLT:</b> Call that bolt <b>1</b>. Then move <b>clockwise</b> around the flange and label each bolt left-to-right using the row below.</div><div class="bolt-clock-strip">' +
    cards +
    '</div><div class="bolt-easy-sequence">CLOCKWISE LABELS: ' +
    clockwiseLabels +
    '</div><div class="bolt-layout-help">After the flange is labeled, tighten in numerical order <b>1 → 2 → 3 → 4…</b>. Use the same tightening-number sequence for each required torque pass.</div></div>';
}

function initTorqueSizes() {
  let sel = $('torqueSize');
  TORQUE_SIZES.forEach(x => sel.add(new Option(x, x)));
  sel.value = '4';
  renderFlangeWrenchTable();
}

function torqueFamilyChanged() {
  if (
    $('torqueFamily').value === 'rubberSoft' ||
    $('torqueFamily').value === 'rubberHard'
  )
    $('torqueClass').value = '150';
  torqueCalc();
}

function torqueCalc() {
  let fam = $('torqueFamily').value,
    cls = $('torqueClass').value,
    size = $('torqueSize').value,
    i = TORQUE_SIZES.indexOf(size);
  if (i < 0) return;
  if (fam === 'sheet') {
    let d = TORQUE_SHEET[cls],
      rows = [
        ['Minimum recommended / bolt', '<span class="torque-big">' + d.min[i] + ' ft-lb</span>'],
        ['Preferred torque / bolt', d.pref[i] + ' ft-lb'],
        ['Bolting', d.bolts[i]],
      ];
    result('torqueOut', addFlangeWrenchRows(rows, d.bolts[i]));
    return;
  }
  if (fam === 'graphlock') {
    let d = TORQUE_GRAPHLOCK[cls];
    result('torqueOut', [
      ['Minimum recommended / bolt', '<span class="torque-big">' + d.min[i] + ' ft-lb</span>'],
      ['Preferred torque / bolt', d.pref[i] + ' ft-lb'],
      ['Wrench size', 'Use the actual flange bolt / nut size; no bolting diameter is loaded for this gasket table.'],
    ]);
    return;
  }
  if (fam === 'flexseal') {
    let d = TORQUE_FLEXSEAL[cls][size];
    if (!d) return;
    const bolting = d[0] + ' × ' + d[1] + '"';
    const rows = [
      ['Minimum torque / bolt', '<span class="torque-big">' + d[2] + ' ft-lb</span>'],
      ['Preferred torque / bolt', d[3] + ' ft-lb'],
      ['Bolting', bolting],
    ];
    result('torqueOut', addFlangeWrenchRows(rows, bolting));
    return;
  }
  if (fam === 'rubberSoft' || fam === 'rubberHard') {
    if (cls !== '150') {
      $('torqueClass').value = '150';
      cls = '150';
    }
    let d = TORQUE_RUBBER_150,
      pref = fam === 'rubberSoft' ? d.soft[i] : d.hard[i],
      rows = [
        ['Preferred torque / bolt', '<span class="torque-big">' + pref + ' ft-lb</span>'],
        ['Minimum torque / bolt', d.min[i] + ' ft-lb'],
        ['Bolting', d.bolts[i]],
      ];
    result('torqueOut', addFlangeWrenchRows(rows, d.bolts[i]));
  }
}

function tab(id, b) {
  document
    .querySelectorAll('.page')
    .forEach(x => x.classList.toggle('on', x.id === id));
  document
    .querySelectorAll('.tabs button')
    .forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  if (id === 'iso' && typeof isoRenderSketch === 'function') isoRenderSketch();
  scrollTo(0, 0);
}

function refreshAll() {
  offsetCalc();
  rollCalc();
  spoolCalc();
  saddleCalc();
  bwCalc();
  wardCalc();
  torqueCalc();
}
