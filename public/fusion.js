let fusionTimerHandle = null;
let fusionTimerEndsAt = 0;
let fusionTimerLabel = '';
let fusionTimerStartedSeconds = 0;

const AQ_SOCKET = {
  '1/2': { mm: 20, depth: '9/16 in', warm: 5, cold: 8, transition: 4, cool: 2 },
  '3/4': { mm: 25, depth: '5/8 in', warm: 7, cold: 11, transition: 4, cool: 2 },
  '1': { mm: 32, depth: '11/16 in', warm: 8, cold: 12, transition: 6, cool: 4 },
  '1-1/4': { mm: 40, depth: '13/16 in', warm: 12, cold: 18, transition: 6, cool: 4 },
  '1-1/2': { mm: 50, depth: '15/16 in', warm: 18, cold: 27, transition: 6, cool: 4 },
  '2': { mm: 63, depth: '1-1/16 in', warm: 24, cold: 36, transition: 8, cool: 6 },
  '2-1/2': { mm: 75, depth: '1-3/16 in', warm: 30, cold: 45, transition: 8, cool: 8 },
  '3': { mm: 90, depth: '1-5/16 in', warm: 40, cold: 60, transition: 8, cool: 8 },
  '3-1/2': { mm: 110, depth: '1-7/16 in', warm: 50, cold: 75, transition: 10, cool: 8 },
  '4': { mm: 125, depth: '1-9/16 in', warm: 60, cold: 90, transition: 10, cool: 8 },
};

const NUPI_SOCKET = {
  '1/2': { mm: 20, depth: '9/16 in', standard: 5, sdr17: null, change: 4, clamp: 6, cool: 2 },
  '3/4': { mm: 25, depth: '5/8 in', standard: 7, sdr17: null, change: 4, clamp: 10, cool: 2 },
  '1': { mm: 32, depth: '11/16 in', standard: 8, sdr17: null, change: 6, clamp: 10, cool: 4 },
  '1-1/4': { mm: 40, depth: '13/16 in', standard: 12, sdr17: null, change: 6, clamp: 20, cool: 4 },
  '1-1/2': { mm: 50, depth: '15/16 in', standard: 18, sdr17: null, change: 6, clamp: 20, cool: 4 },
  '2': { mm: 63, depth: '1-1/16 in', standard: 24, sdr17: 10, change: 8, clamp: 30, cool: 6 },
  '2-1/2': { mm: 75, depth: '1-3/16 in', standard: 30, sdr17: 15, change: 8, clamp: 30, cool: 6 },
  '3': { mm: 90, depth: '1-5/16 in', standard: 40, sdr17: 22, change: 8, clamp: 40, cool: 6 },
  '3-1/2': { mm: 110, depth: '1-7/16 in', standard: 50, sdr17: 30, change: 10, clamp: 50, cool: 8 },
  '4': { mm: 125, depth: '1-9/16 in', standard: 60, sdr17: 35, change: 10, clamp: 60, cool: 8 },
};

const AQ_BUTT = [
  { wall: 4.5, heat: 53, cool: [4, 5, 6.5] }, { wall: 7, heat: 81, cool: [6, 7.5, 9.5] },
  { wall: 12, heat: 135, cool: [9.5, 12, 15.5] }, { wall: 19, heat: 206, cool: [14, 18, 24] },
  { wall: 26, heat: 271, cool: [19, 24, 32] }, { wall: 37, heat: 362, cool: [27, 34, 45] },
  { wall: 50, heat: 450, cool: [36, 46, 61] }, { wall: 70, heat: 546, cool: [50, 64, 85] },
];

const NUPI_BUTT = [
  { label: '2.0–4.5 mm', bead: 0.5, heat: '60–135 s', remove: '4–5 s', pressure: '5–6 s', hold: '3–6 min' },
  { label: '4.5–7 mm', bead: 0.5, heat: '135–175 s', remove: '5–6 s', pressure: '6–7 s', hold: '6–12 min' },
  { label: '7–12 mm', bead: 1, heat: '175–245 s', remove: '6–7 s', pressure: '7–11 s', hold: '12–20 min' },
  { label: '12–19 mm', bead: 1, heat: '245–330 s', remove: '7–9 s', pressure: '11–17 s', hold: '20–30 min' },
  { label: '19–26 mm', bead: 1.5, heat: '330–400 s', remove: '9–11 s', pressure: '17–22 s', hold: '30–40 min' },
  { label: '26–37 mm', bead: 2, heat: '400–485 s', remove: '11–14 s', pressure: '22–32 s', hold: '40–55 min' },
  { label: '37–50 mm', bead: 2.5, heat: '485–560 s', remove: '14–17 s', pressure: '32–43 s', hold: '55–70 min' },
];

const HDPE_SOCKET = {
  '1/2 CTS': { depth: '0.625 in', '4710': [6, 10, 30], '2708': [6, 7, 30] },
  '3/4 CTS': { depth: '0.625 in', '4710': [6, 10, 30], '2708': [6, 7, 30] },
  '1 CTS': { depth: '0.625 in', '4710': [9, 16, 30], '2708': [9, 10, 30] },
  '1-1/4 CTS': { depth: '0.687 in', '4710': [10, 16, 30], '2708': [10, 12, 30] },
  '1/2 IPS': { depth: '0.625 in', '4710': [6, 10, 30], '2708': [6, 7, 30] },
  '3/4 IPS': { depth: '0.625 in', '4710': [8, 14, 30], '2708': [8, 10, 30] },
  '1 IPS': { depth: '0.687 in', '4710': [15, 17, 30], '2708': [10, 12, 30] },
  '1-1/4 IPS': { depth: '0.875 in', '4710': [18, 21, 60], '2708': [12, 14, 45] },
  '1-1/2 IPS': { depth: '0.875 in', '4710': [20, 23, 60], '2708': [14, 17, 45] },
  '2 IPS': { depth: '0.875 in', '4710': [24, 28, 60], '2708': [16, 19, 45] },
  '3 IPS': { depth: '1.000 in', '4710': [28, 32, 75], '2708': [20, 24, 60] },
  '4 IPS': { depth: '1.125 in', '4710': [32, 37, 75], '2708': [24, 29, 60] },
};

function fusionEl(id) { return document.getElementById(id); }
function fusionKpi(label, value) { return `<div class='fusion-kpi'><b>${label}</b><strong>${value}</strong></div>`; }
function fusionPanel(kpis, note, actions = '') { return `<div class='fusion-kpis'>${kpis.join('')}</div>${actions ? `<div class='fusion-actions'>${actions}</div>` : ''}<div class='fusion-source'>${note}</div>`; }
function fusionEscape(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function fusionButton(label, seconds, timerLabel) {
  const duration = Math.max(0, Math.round(Number(seconds) || 0));
  return `<button type='button' data-fusion-timer-start='${duration}' data-fusion-timer-label='${encodeURIComponent(timerLabel)}'>${label}</button>`;
}

function fusionFormatTimer(seconds) {
  const value = Math.max(0, Math.ceil(Number(seconds) || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

function fusionRenderTimer(remaining, state = 'running') {
  const bar = fusionEl('fusionTimerBar');
  if (!bar) return;
  bar.classList.remove('hidden', 'done');
  if (state === 'complete') bar.classList.add('done');
  const status = state === 'complete' ? 'COMPLETE' : state === 'stopped' ? `STOPPED • ${fusionFormatTimer(remaining)} remaining` : fusionFormatTimer(remaining);
  const action = state === 'running' ? `<button type='button' data-fusion-timer-stop>STOP TIMER</button>` : `<button type='button' data-fusion-timer-dismiss>DISMISS</button>`;
  bar.innerHTML = `<div><b>${fusionEscape(fusionTimerLabel)}</b><div>${status}</div></div><div class='fusion-actions'>${action}</div>`;
}

function fusionStartTimer(seconds, label) {
  const duration = Math.max(0, Math.round(Number(seconds) || 0));
  const bar = fusionEl('fusionTimerBar');
  if (!bar || !duration) return;
  if (fusionTimerHandle) clearInterval(fusionTimerHandle);
  fusionTimerLabel = String(label || 'Fusion timer');
  fusionTimerStartedSeconds = duration;
  fusionTimerEndsAt = Date.now() + duration * 1000;
  const tick = () => {
    const remaining = Math.max(0, Math.ceil((fusionTimerEndsAt - Date.now()) / 1000));
    if (!remaining) {
      if (fusionTimerHandle) clearInterval(fusionTimerHandle);
      fusionTimerHandle = null;
      fusionTimerEndsAt = 0;
      fusionRenderTimer(0, 'complete');
      if (navigator.vibrate) navigator.vibrate([180, 100, 180]);
      return;
    }
    fusionRenderTimer(remaining, 'running');
  };
  fusionTimerHandle = setInterval(tick, 250);
  tick();
}

function fusionStopTimer() {
  const remaining = fusionTimerEndsAt ? Math.max(0, Math.ceil((fusionTimerEndsAt - Date.now()) / 1000)) : fusionTimerStartedSeconds;
  if (fusionTimerHandle) clearInterval(fusionTimerHandle);
  fusionTimerHandle = null;
  fusionTimerEndsAt = 0;
  fusionRenderTimer(remaining, 'stopped');
}

function fusionDismissTimer() {
  if (fusionTimerHandle) clearInterval(fusionTimerHandle);
  fusionTimerHandle = null;
  fusionTimerEndsAt = 0;
  fusionTimerStartedSeconds = 0;
  fusionTimerLabel = '';
  fusionEl('fusionTimerBar')?.classList.add('hidden');
}

function fusionTimerClick(event) {
  const start = event.target.closest?.('[data-fusion-timer-start]');
  if (start) {
    event.preventDefault();
    fusionStartTimer(Number(start.dataset.fusionTimerStart), decodeURIComponent(start.dataset.fusionTimerLabel || 'Fusion timer'));
    return;
  }
  if (event.target.closest?.('[data-fusion-timer-stop]')) {
    event.preventDefault();
    fusionStopTimer();
    return;
  }
  if (event.target.closest?.('[data-fusion-timer-dismiss]')) {
    event.preventDefault();
    fusionDismissTimer();
  }
}

function fillFusionSelect(id, values, formatter = value => value) {
  const select = fusionEl(id);
  if (!select) return;
  select.innerHTML = values.map(value => `<option value='${value}'>${formatter(value)}</option>`).join('');
}

function aqFusionCalc() {
  const row = AQ_SOCKET[fusionEl('aqFusionSize')?.value];
  if (!row) return;
  const cold = fusionEl('aqFusionAmbient')?.value === 'cold';
  const heat = cold ? row.cold : row.warm;
  fusionEl('aqFusionOut').innerHTML = fusionPanel([
    fusionKpi('Insertion / pipe takeoff', row.depth), fusionKpi('Heater', '500°F ±18°F'),
    fusionKpi('Heat soak', `${heat} sec`), fusionKpi('Max transition', `${row.transition} sec`), fusionKpi('Cool', `${row.cool} min`),
  ], `Aquatherm ${row.mm} mm socket-fusion reference. The insertion depth is pipe engagement, not fitting center-to-end. Verify the current Aquatherm procedure and job conditions before fusing.`, `${fusionButton('START HEAT', heat, 'Aquatherm heat')} ${fusionButton('START COOL', row.cool * 60, 'Aquatherm cool')}`);
}

function nupiFusionCalc() {
  const row = NUPI_SOCKET[fusionEl('nupiFusionSize')?.value];
  if (!row) return;
  const family = fusionEl('nupiFusionSdr')?.value || 'standard';
  const heat = row[family];
  const heatText = heat == null ? 'Not loaded — verify manual' : `${heat} sec`;
  const actions = `${heat == null ? '' : fusionButton('START HEAT', heat, 'NUPI heat')} ${fusionButton('START COOL', row.cool * 60, 'NUPI total cool')}`;
  fusionEl('nupiFusionOut').innerHTML = fusionPanel([
    fusionKpi('Insertion / pipe takeoff', row.depth), fusionKpi('Heater', '500°F ±18°F'), fusionKpi('Heat soak', heatText),
    fusionKpi('Max changeover', `${row.change} sec`), fusionKpi('Clamped', `${row.clamp} sec`), fusionKpi('Total cool', `${row.cool} min`),
  ], `NIRON ${row.mm} mm socket-fusion reference. SDR 17 timing is only shown where the loaded NUPI table provides it. Manufacturer/job procedure controls.`, actions);
}

function ppButtMakerChanged() {
  const maker = fusionEl('ppButtMaker')?.value || 'aquatherm';
  const wall = fusionEl('ppButtWall');
  const ambientWrap = fusionEl('ppButtAmbientWrap');
  if (!wall) return;
  if (maker === 'aquatherm') {
    wall.innerHTML = AQ_BUTT.map((row, index) => `<option value='${index}'>${row.wall} mm wall</option>`).join('');
    ambientWrap?.classList.remove('hidden');
  } else {
    wall.innerHTML = NUPI_BUTT.map((row, index) => `<option value='${index}'>${row.label}</option>`).join('');
    ambientWrap?.classList.add('hidden');
  }
  ppButtCalc();
}

function ppButtCalc() {
  const maker = fusionEl('ppButtMaker')?.value || 'aquatherm';
  const index = Number(fusionEl('ppButtWall')?.value || 0);
  const out = fusionEl('ppButtOut');
  if (!out) return;
  if (maker === 'aquatherm') {
    const row = AQ_BUTT[index] || AQ_BUTT[0];
    const ambient = fusionEl('ppButtAmbient')?.value || 'normal';
    const coolIndex = ambient === 'cool' ? 0 : ambient === 'hot' ? 2 : 1;
    const cool = row.cool[coolIndex];
    out.innerHTML = fusionPanel([
      fusionKpi('Wall', `${row.wall} mm`), fusionKpi('Heater', 'about 410°F / 210°C'), fusionKpi('Heat soak', `${row.heat} sec`), fusionKpi('Cool under pressure', `${cool} min`),
    ], 'Aquatherm butt-fusion timing reference. Cooling values vary with ambient temperature; use the qualified procedure for pressure, bead and support requirements.', `${fusionButton('START HEAT', row.heat, 'Aquatherm butt heat')} ${fusionButton('START COOL', cool * 60, 'Aquatherm butt cool')}`);
  } else {
    const row = NUPI_BUTT[index] || NUPI_BUTT[0];
    out.innerHTML = fusionPanel([
      fusionKpi('Wall range', row.label), fusionKpi('Initial bead', `${row.bead} mm`), fusionKpi('Heat soak', row.heat), fusionKpi('Heater removal max', row.remove), fusionKpi('Reach pressure max', row.pressure), fusionKpi('Fusion hold', row.hold),
    ], 'NUPI/NIRON PP-R butt-fusion reference range. The listed fusion-hold phase is not permission to stress the joint; complete cooling to ambient and the current NUPI/job procedure control.');
  }
}

function hdpeBeadTarget(od) {
  if (od <= 1.25) return '1/32–1/16 in';
  if (od <= 3) return 'about 1/16 in';
  if (od <= 8) return '1/8–3/16 in';
  if (od <= 12) return '3/16–1/4 in';
  if (od <= 24) return '1/4–7/16 in';
  if (od <= 36) return 'about 7/16 in';
  return 'about 9/16 in';
}

function hdpeButtCalc() {
  const od = Number(fusionEl('hdpeButtOD')?.value);
  const dr = Number(fusionEl('hdpeButtDR')?.value);
  const ifp = Number(fusionEl('hdpeButtIFP')?.value);
  const tepa = Number(fusionEl('hdpeButtTEPA')?.value);
  const drag = Number(fusionEl('hdpeButtDrag')?.value) || 0;
  const out = fusionEl('hdpeButtOut');
  if (!out || !(od > 0) || !(dr > 0)) return;
  const wall = od / dr;
  const coolMin = wall * 11;
  const heatMin = od >= 14 ? wall * 4.5 : null;
  const area = Math.PI * (od - wall) * wall;
  const force = ifp > 0 ? area * ifp : NaN;
  const gauge = tepa > 0 && Number.isFinite(force) ? force / tepa + drag : NaN;
  const kpis = [fusionKpi('Wall', `${wall.toFixed(3)} in`), fusionKpi('Heater surface', '400–450°F'), fusionKpi('Melt bead target', hdpeBeadTarget(od)), fusionKpi('Heat soak', heatMin ? `≥ ${heatMin.toFixed(1)} min` : 'Bead-controlled'), fusionKpi('Cool under fusion pressure', `≥ ${coolMin.toFixed(1)} min`)];
  if (Number.isFinite(gauge)) kpis.push(fusionKpi('Calculated machine gauge', `${gauge.toFixed(0)} psi + verified drag`));
  const heatAction = heatMin ? fusionButton('START MIN HEAT', Math.round(heatMin * 60), 'HDPE minimum heat') : '';
  const gaugeNote = Number.isFinite(gauge) ? ` Gauge calculation uses fusion area × ${ifp} psi interfacial pressure ÷ TEPA + entered drag; confirm machine piston area and qualified procedure.` : ' Enter machine TEPA only if you want a theoretical gauge-pressure check; interfacial pressure is not the machine gauge setting.';
  out.innerHTML = fusionPanel(kpis, `PPI TR-33 / ASTM F2620 field reference. For 14 in IPS and larger, the loaded minimum heat soak is 4.5 min per inch wall and minimum cool under pressure is 11 min per inch wall. Smaller sizes remain bead-controlled in this reference.${gaugeNote}`, `${heatAction} ${fusionButton('START COOL', Math.round(coolMin * 60), 'HDPE cool under pressure')}`);
}

function hdpeSocketCalc() {
  const row = HDPE_SOCKET[fusionEl('hdpeSocketSize')?.value];
  if (!row) return;
  const resin = fusionEl('hdpeSocketResin')?.value || '4710';
  const timing = row[resin];
  fusionEl('hdpeSocketOut').innerHTML = fusionPanel([
    fusionKpi('Depth gage / pipe takeoff', row.depth), fusionKpi('Heater', 'about 500°F'), fusionKpi('Heat range', `${timing[0]}–${timing[1]} sec`), fusionKpi('Initial cool', `${timing[2]} sec`), fusionKpi('Before stress', '+5 min'),
  ], 'ASTM F1056 depth-gage reference with Performance Pipe socket-fusion timing ranges. Confirm tool temperature, material designation and the current manufacturer procedure before use.', `${fusionButton('START INITIAL COOL', timing[2], 'HDPE socket initial cool')} ${fusionButton('START NO-STRESS 5 MIN', 300, 'HDPE socket no-stress hold')}`);
}

function initFusionPipe() {
  fillFusionSelect('aqFusionSize', Object.keys(AQ_SOCKET), value => `${value} in / ${AQ_SOCKET[value].mm} mm`);
  fillFusionSelect('nupiFusionSize', Object.keys(NUPI_SOCKET), value => `${value} in / ${NUPI_SOCKET[value].mm} mm`);
  fillFusionSelect('hdpeSocketSize', Object.keys(HDPE_SOCKET));
  ppButtMakerChanged();
  aqFusionCalc();
  nupiFusionCalc();
  hdpeButtCalc();
  hdpeSocketCalc();
}

document.addEventListener('click', fusionTimerClick);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFusionPipe, { once: true });
else initFusionPipe();
