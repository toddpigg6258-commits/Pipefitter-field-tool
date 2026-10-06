function tubeNum(id) { return Number(document.getElementById(id)?.value); }
function tubeOut(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function tubeBendCalc() {
  const r = tubeNum('tubeClr'), a = tubeNum('tubeAngle');
  if (!(r > 0) || !(a > 0) || !(a < 180)) { tubeOut('tubeBendResult', 'Enter a CLR greater than 0 and a bend angle between 0° and 180°.'); return; }
  const rad = a * Math.PI / 180;
  const ba = r * rad;
  const sb = r * Math.tan(rad / 2);
  tubeOut('tubeBendResult', `<b>Bend allowance / centerline arc:</b> ${ba.toFixed(3)} in • <b>tangent setback:</b> ${sb.toFixed(3)} in from the theoretical intersection on each leg.<br><span class="muted">Use these as centerline geometry. Transfer to the actual bender's start/arrow convention before bending.</span>`);
}
function tubeOffsetCalc() {
  const o = tubeNum('tubeOffset'), a = tubeNum('tubeOffsetAngle');
  const rad = a * Math.PI / 180;
  if (!(o > 0) || !(a > 0) || !(a < 90)) { tubeOut('tubeOffsetResult', 'Enter a positive offset and an angle between 0° and 90°.'); return; }
  tubeOut('tubeOffsetResult', `<b>Centerline travel between corresponding bend points:</b> ${(o / Math.sin(rad)).toFixed(3)} in • <b>straight advance/run:</b> ${(o / Math.tan(rad)).toFixed(3)} in.<br><span class="muted">Verify the bender's CLR/start-mark convention before transferring these geometric points to tube marks.</span>`);
}
function tubeRollCalc() {
  const s = tubeNum('tubeSide'), v = tubeNum('tubeVertical');
  if (!(s >= 0) || !(v >= 0) || s + v === 0) { tubeOut('tubeRollResult', 'Enter side and vertical components.'); return; }
  const trueOffset = Math.hypot(s, v);
  const rotation = Math.atan2(v, s) * 180 / Math.PI;
  tubeOut('tubeRollResult', `<b>True offset:</b> ${trueOffset.toFixed(3)} in • <b>rotation from side/horizontal reference:</b> ${rotation.toFixed(1)}°.<br><span class="muted">Always define the viewing/datum end before calling rotation clockwise or counterclockwise.</span>`);
}
function tubeSagCalc() {
  const r = tubeNum('tubeSagRadius'), a = tubeNum('tubeSagAngle');
  if (!(r > 0) || !(a > 0) || !(a < 180)) { tubeOut('tubeSagResult', 'Enter a positive bender CLR and a bend angle between 0° and 180°.'); return; }
  const rad = a * Math.PI / 180;
  const setback = r * Math.tan(rad / 2);
  const advance = r * rad;
  const gain = 2 * setback - advance;
  tubeOut('tubeSagResult', `<b>Setback:</b> ${setback.toFixed(3)} in • <b>Advance:</b> ${advance.toFixed(3)} in • <b>Gain:</b> ${gain.toFixed(3)} in.<br><span class="muted">S = R × tan(θ/2) • A = R × θ(rad) • G = 2S − A. Use the actual bender CLR.</span>`);
}
function tubeInit() { tubeBendCalc(); tubeOffsetCalc(); tubeRollCalc(); tubeSagCalc(); }
