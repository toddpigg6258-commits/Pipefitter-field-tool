const FIELD_REFERENCE = [
  ['Welding fit-up','Welding','Joint preparation, alignment, cleanliness, preheat/interpass and WPS checkpoints.','welding'],
  ['Welding procedure WPS','Welding','How to read the production WPS and the variables a fitter/welder needs to verify.','welding'],
  ['Rigging','Rigging','Sling tension, load share, sling angle, center of gravity, hitches and field checks, with a planning calculator.','rigging'],
  ['Confined space','Safety','Permit-space field checklist: isolation, atmosphere, ventilation, attendant, communication and rescue.','confined'],
  ['Hot work','Safety','Hot-work field checklist covering permits, combustibles, fire watch, gas testing and post-work controls.','hotwork'],
  ['Hydrostatic and pneumatic testing','Testing','Test planning, stored-energy cautions, pressure/head math and a water-head calculator.','testing'],
  ['Steam systems','Systems','Steam field reminders for drainage, slope, expansion, traps, supports and startup considerations.','steam'],
  ['Pipe supports and hangers','Supports','Threaded rod capacity, rod sizing, pipe weight, strut loading, concrete anchors, support/guide/anchor concepts and field checks.','supports'],
  ['Material identification','Materials','Material, grade, schedule/wall, heat/lot traceability and compatibility checks.','materials']
];

function fieldReferenceSearch(query = '') {
  const out = document.getElementById('fieldSearchResults');
  const detail = document.getElementById('fieldReferenceDetail');
  if (!out) return;
  if (detail) detail.classList.add('hidden');
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = FIELD_REFERENCE.filter(item => !words.length || words.every(word => item.join(' ').toLowerCase().includes(word))).slice(0, 40);
  out.innerHTML = matches.length ? matches.map(item => `<button class="search-result" onclick="fieldReferenceOpen('${item[3]}')"><b>${item[0]}</b><small>${item[1]}</small><div>${item[2]}</div></button>`).join('') : '<div class="card warn">No loaded offline reference matched that search yet. Try a broader trade term.</div>';
}

const FIELD_DETAILS = {
  rigging: `<h3>Rigging field guide + sling calculator</h3><p>Use this for planning and understanding load paths, not to assign a capacity to unknown gear. The actual sling, shackle, hoist, beam, anchor and attachment must each have an identifiable rated working load and be acceptable under the employer/site lift plan.</p><h4>Core field checks</h4><ul><li>Know total lifted weight, including pipe, fittings, valves, rigging, spreader/beam and anything attached.</li><li>Locate center of gravity. Hook/load line should be arranged so the load remains controlled and does not unexpectedly roll or tip.</li><li>Lower sling angles create higher leg tension. Do not use the calculator to exceed any component WLL.</li><li>Account for hitch configuration, unequal leg loading, edge damage, bending of hardware, side loading, shock/dynamic loading and environmental limits.</li><li>Inspect and identify every component before use. Follow the current manufacturer data and site lift procedure.</li></ul><h4>Symmetrical sling planning calculator</h4><div class="field-calc-grid"><label>Total suspended load (lb)<input id="rigLoad" inputmode="decimal" value="2000" oninput="riggingCalc()"></label><label>Number of load-carrying legs<select id="rigLegs" onchange="riggingCalc()"><option>2</option><option>3</option><option>4</option></select></label><label>Sling angle from horizontal (degrees)<input id="rigAngle" inputmode="decimal" value="60" oninput="riggingCalc()"></label><label>Estimated dynamic/contingency factor<input id="rigFactor" inputmode="decimal" value="1" oninput="riggingCalc()"></label></div><div id="rigResult" class="result field-calc-result"></div><div class="card warn"><b>Important:</b> multi-leg assemblies do not always share load equally. Use the applicable rated assembly data and lift plan. This calculator only shows idealized equal-share geometry and is not a rigging authorization.</div>`,
  testing: `<h3>Pressure testing field guide</h3><p>The governing code, engineering/test package and site procedure set the actual test pressure, duration, boundaries, exclusions and acceptance criteria. Do not derive a required test pressure from this page.</p><h4>Before pressurizing</h4><ul><li>Confirm test limits, blinds/caps, vents, drains, temporary supports and excluded equipment.</li><li>Verify instruments have the required range and calibration status.</li><li>Remove air during hydro fill where the procedure requires it; trapped gas increases stored energy.</li><li>Establish barricades/exclusion zones and controlled pressurization/depressurization.</li><li>Pneumatic tests have substantially greater stored-energy hazard and require the specific approved procedure.</li></ul><h4>Water static-head calculator</h4><div class="field-calc-grid"><label>Elevation difference (ft)<input id="testHeadFt" inputmode="decimal" value="100" oninput="testHeadCalc()"></label><label>Specific gravity<input id="testSG" inputmode="decimal" value="1" oninput="testHeadCalc()"></label><label>Gauge pressure at low point (psi)<input id="testBasePsi" inputmode="decimal" value="0" oninput="testHeadCalc()"></label></div><div id="testHeadResult" class="result field-calc-result"></div><p>For water, static pressure changes approximately 0.433 psi per vertical foot. Specific gravity scales that head relationship.</p>`,
  welding: `<h3>Welding / WPS field reference</h3><ul><li>Verify material identity and joint design before fit-up.</li><li>Check bevel, land/root face, root opening, alignment/hi-low and cleanliness against the drawing/WPS.</li><li>Confirm process, filler classification, position, preheat/interpass controls and any backing/purge requirements from the WPS.</li><li>Protect traceability and required weld identification. Do not substitute generic settings for the qualified WPS.</li><li>For branch or special joints, verify the approved detail rather than assuming a standard preparation.</li></ul>`,
  confined: `<h3>Confined-space field reference</h3><ul><li>Determine whether the space is permit-required under the employer/site program.</li><li>Isolate energy and process hazards using the required lockout, blanking/blinding or other controls.</li><li>Test the atmosphere with the required calibrated instrument and sequence; continue monitoring when required.</li><li>Provide ventilation, attendant, communications and access control as required.</li><li>Have the specified rescue capability available before entry. Do not improvise rescue after an emergency begins.</li></ul>`,
  hotwork: `<h3>Hot-work field reference</h3><ul><li>Use the required permit and verify the work area before striking an arc or using flame.</li><li>Remove/protect combustibles and control sparks, slag and heat transfer through walls/floors.</li><li>Provide the required extinguishing equipment and fire watch.</li><li>Use gas testing where the site/process conditions require it.</li><li>Maintain the required fire watch/post-work inspection period from the governing program.</li></ul>`,
  steam: `<h3>Steam-system field reference</h3><ul><li>Follow design slope and drainage details; pockets can retain condensate.</li><li>Install traps, drip legs, separators and strainers in the orientation/detail shown by design/manufacturer information.</li><li>Preserve thermal movement at guides, anchors, loops/joints and spring supports.</li><li>Check valve orientation and flow direction where applicable.</li><li>Startup/warm-up procedures matter because condensate and rapid thermal change can create severe forces.</li></ul>`,
  supports: `<h3>Pipe supports & hangers field guide</h3><p>This section separates component reference values from system design. The complete support is limited by its weakest verified component: pipe attachment, rod, nuts, strut/member, fittings, anchor, concrete and building structure.</p><h4>Carbon-steel threaded hanger rod — tension reference</h4><div class="table"><table><thead><tr><th>Rod</th><th>MSS SP-58 max safe tension</th></tr></thead><tbody><tr><td>3/8 in</td><td>730 lb</td></tr><tr><td>1/2 in</td><td>1,350 lb</td></tr><tr><td>5/8 in</td><td>2,160 lb</td></tr><tr><td>3/4 in</td><td>3,230 lb</td></tr><tr><td>7/8 in</td><td>4,480 lb</td></tr><tr><td>1 in</td><td>5,900 lb</td></tr><tr><td>1-1/4 in</td><td>9,500 lb</td></tr><tr><td>1-1/2 in</td><td>13,800 lb</td></tr></tbody></table></div><p>MSS SP-58 also restricts 3/8-in rod to NPS 4 and smaller; pipe larger than NPS 4 requires at least 1/2-in rod and must still be sized for design load. Double-rod hangers can have different minimum sizing rules. Verify the current project edition/specification.</p><h4>Pipe + contents load calculator</h4><div class="field-calc-grid"><label>NPS<select id="supportNps" onchange="supportCalc()"><option>1/2</option><option>3/4</option><option>1</option><option>1-1/4</option><option>1-1/2</option><option>2</option><option>2-1/2</option><option>3</option><option>4</option><option>6</option><option>8</option><option>10</option><option>12</option></select></label><label>Schedule<select id="supportSch" onchange="supportCalc()"><option>10</option><option selected>40</option><option>80</option></select></label><label>Supported length (ft)<input id="supportSpan" inputmode="decimal" value="10" oninput="supportCalc()"></label><label>Contents density vs water (specific gravity)<select id="supportSG" onchange="supportCalc()"><option value="1" selected>Water — SG 1.00</option><option value="0.8">Light oil — example SG 0.80</option><option value="0.9">Oil / fuel — example SG 0.90</option><option value="1.1">Dense liquid — example SG 1.10</option><option value="1.2">Dense liquid — example SG 1.20</option></select></label></div><div id="supportResult" class="result field-calc-result"></div><p><b>What specific gravity means:</b> it is the liquid's density (and therefore weight for the same volume) compared with water. Water = 1.00. SG 0.80 means the contents weigh about 80% as much as the same volume of water; SG 1.20 means about 120%. This directly changes the contents lb/ft used in the support load. The non-water choices above are examples only—use the actual fluid SG/density from the job data when support loading matters.</p><p>The calculator shows bare steel weight plus a water-equivalent contents estimate. Add insulation, valves, fittings, concentrated loads and other actual loads separately.</p><h4>Recommended rod selection</h4><p>The result compares calculated gravity load to the MSS carbon-steel rod tension table and applies the NPS 4 minimum-size restriction. It is a screening aid, not an engineered support selection; temperature, corrosion, vibration/seismic, hanger geometry and project requirements can govern.</p><h4>Single vs double strut</h4><p>Strut capacity cannot be represented by one universal number. It changes with manufacturer, channel series/gauge, orientation, span, load position, connection and allowable deflection. A double/back-to-back channel is also not safely assumed to be exactly 2× a single channel. Use the exact manufacturer span/load table for the installed channel and fittings. The calculator below lets you compare a known published allowable to the applied load without inventing a generic capacity.</p><div class="field-calc-grid"><label>Published allowable for selected strut assembly (lb)<input id="strutAllow" inputmode="decimal" placeholder="from manufacturer table" oninput="strutCheck()"></label><label>Applied support load (lb)<input id="strutLoad" inputmode="decimal" placeholder="calculated/engineered load" oninput="strutCheck()"></label></div><div id="strutResult" class="result field-calc-result"></div><h4>Concrete anchors</h4><p>There is no safe universal capacity chart by anchor diameter alone. Concrete strength, cracked/uncracked condition, anchor product, embedment, edge distance, spacing, installation, tension/shear interaction and seismic qualification materially change capacity. Select the exact approved anchor and use its current manufacturer/ICC design data. Do not substitute a generic wedge/drop-in/adhesive value.</p><div class="field-calc-grid"><label>Published allowable/design resistance for exact anchor (lb)<input id="anchorAllow" inputmode="decimal" placeholder="verified product value" oninput="anchorCheck()"></label><label>Applied anchor load (lb)<input id="anchorLoad" inputmode="decimal" placeholder="design load" oninput="anchorCheck()"></label></div><div id="anchorResult" class="result field-calc-result"></div><h4>Trapeze / multiple-pipe rack reactions</h4><p>Enter individual pipe/support loads and their positions from the left rod. This resolves ideal static left/right reactions for a simply supported trapeze and estimates maximum beam moment.</p><div class="field-calc-grid"><label>Trapeze span (in)<input id="trapSpan" inputmode="decimal" value="48" oninput="trapezeCalc()"></label><label>Loads, lb (comma separated)<input id="trapLoads" value="500,500" oninput="trapezeCalc()"></label><label>Positions from left, in<input id="trapPos" value="12,36" oninput="trapezeCalc()"></label></div><div id="trapezeResult" class="result field-calc-result"></div><h4>Added insulation, valve and fitting loads</h4><div class="field-calc-grid"><label>Base support load (lb)<input id="extraBase" inputmode="decimal" value="500" oninput="extraLoadCalc()"></label><label>Insulation/jacket (lb)<input id="extraIns" inputmode="decimal" value="0" oninput="extraLoadCalc()"></label><label>Valves/fittings/concentrated load (lb)<input id="extraPoint" inputmode="decimal" value="0" oninput="extraLoadCalc()"></label><label>Contingency factor<input id="extraFactor" inputmode="decimal" value="1" oninput="extraLoadCalc()"></label></div><div id="extraLoadResult" class="result field-calc-result"></div><h4>Cantilever strut / bracket moment</h4><div class="field-calc-grid"><label>Point load (lb)<input id="cantLoad" inputmode="decimal" value="200" oninput="cantileverCalc()"></label><label>Distance from wall (in)<input id="cantArm" inputmode="decimal" value="18" oninput="cantileverCalc()"></label><label>Published allowable moment (lb-in)<input id="cantAllow" inputmode="decimal" value="5000" oninput="cantileverCalc()"></label></div><div id="cantResult" class="result field-calc-result"></div><h4>Beam clamp / building attachment</h4><div class="field-calc-grid"><label>Verified attachment WLL (lb)<input id="beamAllow" inputmode="decimal" value="1000" oninput="beamClampCalc()"></label><label>Applied hanger reaction (lb)<input id="beamLoad" inputmode="decimal" value="500" oninput="beamClampCalc()"></label></div><div id="beamResult" class="result field-calc-result"></div><h4>Concrete anchor tension + shear screen</h4><p>For combined loading, use the exact manufacturer/code interaction equation. This conservative linear screen is only a quick check after you enter verified product-specific tension and shear values.</p><div class="field-calc-grid"><label>Verified tension value (lb)<input id="ancTAllow" inputmode="decimal" value="1000" oninput="anchorInteractionCalc()"></label><label>Applied tension (lb)<input id="ancT" inputmode="decimal" value="500" oninput="anchorInteractionCalc()"></label><label>Verified shear value (lb)<input id="ancVAllow" inputmode="decimal" value="1000" oninput="anchorInteractionCalc()"></label><label>Applied shear (lb)<input id="ancV" inputmode="decimal" value="0" oninput="anchorInteractionCalc()"></label></div><div id="anchorInteractionResult" class="result field-calc-result"></div><h4>Long rod / compression and buckling</h4><p>Hanger rod tension ratings are not compression ratings. If rod is expected to act as a compression member, stanchion, brace or lateral/seismic member, slenderness, Euler/inelastic buckling, end conditions and connections require an engineered check.</p><h4>Support spacing / placement guidance</h4><ul><li>Spacing depends on pipe material, NPS, schedule/wall, contents, insulation, temperature, allowable sag/stress and project/code requirements—not size alone.</li><li>Heavy valves, strainers, specialties, branches and changes of direction can require local support independent of normal straight-run spacing.</li><li>For racks, calculate each pipe line load and position; check channel bending/deflection plus both rod, anchor and building-attachment reactions.</li><li>Cold/cryogenic piping requires load-bearing insulation/shields and vapor-barrier details suitable for operating temperature.</li><li>Hot piping must preserve designed thermal movement at guides, anchors, loops/joints and spring supports.</li><li>Risers require approved riser clamps/supports and intentional load distribution between floors.</li><li>Beam clamps must match flange thickness/range and orientation; verify side-load restrictions, set screws and retaining straps where required.</li><li>Temporary construction supports are not automatically acceptable permanent supports.</li></ul><div class="card warn"><b>Design boundary:</b> these tools do load arithmetic and utilization screening. Exact strut, anchor, insert, clamp, weld and building-structure capacity must come from the approved manufacturer/design information for the actual installation.</div>`,
  materials: `<h3>Material identification</h3><ul><li>Confirm specification, grade, nominal size and schedule/wall before fabrication.</li><li>Maintain heat/lot traceability when required by the project quality program.</li><li>Verify fittings, flanges, valves, bolting and filler materials are compatible with the line class.</li><li>Keep required identification through cutting and transfer markings only under the approved procedure.</li><li>Do not identify alloy/material solely by appearance.</li></ul>`
};

function fieldReferenceOpen(key) {
  const out = document.getElementById('fieldSearchResults');
  const detail = document.getElementById('fieldReferenceDetail');
  if (!detail || !FIELD_DETAILS[key]) return;
  if (out) out.classList.add('hidden');
  detail.innerHTML = `<div class="detail-head"><button onclick="fieldReferenceBack()">← BACK</button><b>FIELD REFERENCE</b></div><div class="card">${FIELD_DETAILS[key]}</div>`;
  detail.classList.remove('hidden');
  detail.scrollIntoView({behavior:'smooth',block:'start'});
  if (key === 'rigging') riggingCalc();
  if (key === 'testing') testHeadCalc();
  if (key === 'supports') { supportCalc(); trapezeCalc(); extraLoadCalc(); cantileverCalc(); beamClampCalc(); anchorInteractionCalc(); }
}

function fieldReferenceBack() {
  const out = document.getElementById('fieldSearchResults');
  const detail = document.getElementById('fieldReferenceDetail');
  if (detail) detail.classList.add('hidden');
  if (out) out.classList.remove('hidden');
}

function riggingCalc() {
  const load = Number(document.getElementById('rigLoad')?.value);
  const legs = Number(document.getElementById('rigLegs')?.value);
  const angle = Number(document.getElementById('rigAngle')?.value);
  const factor = Number(document.getElementById('rigFactor')?.value);
  const out = document.getElementById('rigResult');
  if (!out) return;
  if (!(load > 0) || !(legs >= 2) || !(angle > 0 && angle <= 90) || !(factor >= 1)) { out.textContent = 'Enter a positive load, angle from 1–90°, and factor of at least 1.00.'; return; }
  const effective = load * factor;
  const verticalShare = effective / legs;
  const tension = verticalShare / Math.sin(angle * Math.PI / 180);
  const multiplier = 1 / Math.sin(angle * Math.PI / 180);
  out.innerHTML = `<b>Planning result:</b> factored suspended load ${effective.toFixed(0)} lb • ideal vertical share ${verticalShare.toFixed(0)} lb/leg • angle multiplier ${multiplier.toFixed(3)} • idealized tension ${tension.toFixed(0)} lb per carrying leg.<br><b>Do not treat this as allowable capacity.</b> Compare the complete configuration with the identified manufacturer's rated WLL and approved lift plan.`;
}

const SUPPORT_PIPE = {
  '1/2': {od:0.840,w:{10:0.671,40:0.851,80:1.088},t:{10:0.083,40:0.109,80:0.147}},
  '3/4': {od:1.050,w:{10:0.857,40:1.131,80:1.474},t:{10:0.083,40:0.113,80:0.154}},
  '1': {od:1.315,w:{10:1.404,40:1.679,80:2.172},t:{10:0.109,40:0.133,80:0.179}},
  '1-1/4': {od:1.660,w:{10:1.806,40:2.273,80:2.997},t:{10:0.109,40:0.140,80:0.191}},
  '1-1/2': {od:1.900,w:{10:2.089,40:2.718,80:3.631},t:{10:0.109,40:0.145,80:0.200}},
  '2': {od:2.375,w:{10:2.638,40:3.653,80:5.022},t:{10:0.109,40:0.154,80:0.218}},
  '2-1/2': {od:2.875,w:{10:3.531,40:5.793,80:7.661},t:{10:0.120,40:0.203,80:0.276}},
  '3': {od:3.500,w:{10:4.332,40:7.576,80:10.25},t:{10:0.120,40:0.216,80:0.300}},
  '4': {od:4.500,w:{10:5.613,40:10.79,80:14.98},t:{10:0.120,40:0.237,80:0.337}},
  '6': {od:6.625,w:{10:8.405,40:18.97,80:28.57},t:{10:0.134,40:0.280,80:0.432}},
  '8': {od:8.625,w:{10:10.96,40:28.55,80:43.39},t:{10:0.148,40:0.322,80:0.500}},
  '10': {od:10.750,w:{10:15.19,40:40.48,80:64.33},t:{10:0.165,40:0.365,80:0.594}},
  '12': {od:12.750,w:{10:18.14,40:49.56,80:88.63},t:{10:0.180,40:0.406,80:0.688}}
};
const ROD_CAPACITY = [['3/8',730],['1/2',1350],['5/8',2160],['3/4',3230],['7/8',4480],['1',5900],['1-1/4',9500],['1-1/2',13800]];
function supportCalc() {
  const nps = document.getElementById('supportNps')?.value;
  const sch = document.getElementById('supportSch')?.value;
  const span = Number(document.getElementById('supportSpan')?.value);
  const sg = Number(document.getElementById('supportSG')?.value);
  const out = document.getElementById('supportResult');
  if (!out || !SUPPORT_PIPE[nps] || !(span > 0) || !(sg >= 0)) return;
  const p = SUPPORT_PIPE[nps], wall = p.t[sch], steel = p.w[sch], id = p.od - 2 * wall;
  const water = Math.PI * id * id / 4 * 12 / 1728 * 62.4 * sg;
  const perFt = steel + water, total = perFt * span;
  const npsNum = nps.includes('-') ? ({'1-1/4':1.25,'1-1/2':1.5,'2-1/2':2.5})[nps] : Number(nps);
  const minRod = npsNum > 4 ? '1/2' : '3/8';
  const start = ROD_CAPACITY.findIndex(r => r[0] === minRod);
  const pick = ROD_CAPACITY.slice(start).find(r => r[1] >= total);
  out.innerHTML = `<b>Approx. bare pipe:</b> ${steel.toFixed(2)} lb/ft • <b>contents:</b> ${water.toFixed(2)} lb/ft • <b>combined:</b> ${perFt.toFixed(2)} lb/ft.<br><b>${span.toFixed(1)} ft gravity load:</b> ${total.toFixed(0)} lb before insulation/fittings/valves/other loads.<br><b>Rod screening:</b> ${pick ? `${pick[0]} in is the first listed MSS rod whose tabulated tension value exceeds this simplified load` : 'load exceeds the rod values loaded here'}. Minimum diameter rule applied: ${minRod} in.`;
}
function strutCheck() {
  const allow=Number(document.getElementById('strutAllow')?.value), load=Number(document.getElementById('strutLoad')?.value), out=document.getElementById('strutResult');
  if (!out) return; if (!(allow>0) || !(load>=0)) {out.textContent='Enter the published allowable for the exact strut assembly and the applied load.';return;}
  out.innerHTML=`<b>Utilization:</b> ${(100*load/allow).toFixed(1)}%. ${load<=allow?'Applied load is below the entered published allowable.':'Applied load exceeds the entered published allowable.'} Verify span, orientation, connections, deflection limit and manufacturer table.`;
}
function anchorCheck() {
  const allow=Number(document.getElementById('anchorAllow')?.value), load=Number(document.getElementById('anchorLoad')?.value), out=document.getElementById('anchorResult');
  if (!out) return; if (!(allow>0) || !(load>=0)) {out.textContent='Enter a verified value for the exact anchor/product/installation and the applied design load.';return;}
  out.innerHTML=`<b>Utilization:</b> ${(100*load/allow).toFixed(1)}%. ${load<=allow?'Applied load is below the entered reference value.':'Applied load exceeds the entered reference value.'} This does not replace required tension/shear interaction, edge/spacing, concrete, seismic or installation checks.`;
}

function trapezeCalc() {
  const span = Number(document.getElementById('trapSpan')?.value);
  const loads = (document.getElementById('trapLoads')?.value || '').split(',').map(Number);
  const pos = (document.getElementById('trapPos')?.value || '').split(',').map(Number);
  const out = document.getElementById('trapezeResult');
  if (!out) return;
  if (!(span > 0) || !loads.length || loads.length !== pos.length || loads.some((v,i) => !(v >= 0) || !(pos[i] >= 0 && pos[i] <= span))) { out.textContent = 'Enter matching loads and positions; every position must fall within the trapeze span.'; return; }
  const total = loads.reduce((a,b)=>a+b,0);
  const right = loads.reduce((a,v,i)=>a + v * pos[i],0) / span;
  const left = total - right;
  let maxMoment = 0;
  for (let step=0; step<=100; step++) { const x=span*step/100; const moment=left*x-loads.reduce((m,v,i)=>m+(pos[i]<=x?v*(x-pos[i]):0),0); maxMoment=Math.max(maxMoment,moment); }
  out.innerHTML = `<b>Total:</b> ${total.toFixed(0)} lb • <b>left rod reaction:</b> ${left.toFixed(0)} lb • <b>right rod reaction:</b> ${right.toFixed(0)} lb • <b>approx. max moment:</b> ${maxMoment.toFixed(0)} lb-in. Check the exact channel table for bending and deflection.`;
}
function extraLoadCalc() {
  const base=Number(document.getElementById('extraBase')?.value), ins=Number(document.getElementById('extraIns')?.value), point=Number(document.getElementById('extraPoint')?.value), factor=Number(document.getElementById('extraFactor')?.value), out=document.getElementById('extraLoadResult');
  if(!out)return; if(!(base>=0)||!(ins>=0)||!(point>=0)||!(factor>=1)){out.textContent='Enter non-negative loads and a factor of at least 1.00.';return;}
  out.innerHTML=`<b>Factored support load:</b> ${((base+ins+point)*factor).toFixed(0)} lb. Place concentrated valve/fitting loads at their actual rack position when calculating trapeze reactions.`;
}
function cantileverCalc() {
  const p=Number(document.getElementById('cantLoad')?.value), arm=Number(document.getElementById('cantArm')?.value), allow=Number(document.getElementById('cantAllow')?.value), out=document.getElementById('cantResult');
  if(!out)return; if(!(p>=0)||!(arm>=0)||!(allow>0)){out.textContent='Enter valid load, arm and published allowable moment.';return;}
  const moment=p*arm; out.innerHTML=`<b>Wall moment:</b> ${moment.toFixed(0)} lb-in • <b>entered allowable utilization:</b> ${(100*moment/allow).toFixed(1)}%. Also verify deflection, torsion, fittings and wall attachment.`;
}
function beamClampCalc() {
  const allow=Number(document.getElementById('beamAllow')?.value), load=Number(document.getElementById('beamLoad')?.value), out=document.getElementById('beamResult');
  if(!out)return; if(!(allow>0)||!(load>=0)){out.textContent='Enter the verified attachment WLL and applied reaction.';return;}
  out.innerHTML=`<b>Attachment utilization:</b> ${(100*load/allow).toFixed(1)}%. Verify flange range/thickness, orientation, set-screw torque, side loading and retaining requirements for the exact clamp.`;
}
function anchorInteractionCalc() {
  const ta=Number(document.getElementById('ancTAllow')?.value), t=Number(document.getElementById('ancT')?.value), va=Number(document.getElementById('ancVAllow')?.value), v=Number(document.getElementById('ancV')?.value), out=document.getElementById('anchorInteractionResult');
  if(!out)return; if(!(ta>0)||!(va>0)||!(t>=0)||!(v>=0)){out.textContent='Enter verified product-specific tension/shear values and applied loads.';return;}
  const tu=t/ta, vu=v/va; out.innerHTML=`<b>Tension:</b> ${(100*tu).toFixed(1)}% • <b>shear:</b> ${(100*vu).toFixed(1)}% • <b>linear interaction screen:</b> ${(100*(tu+vu)).toFixed(1)}%. Use the actual anchor design equation and reductions for concrete, embedment, spacing and edge distance.`;
}

function testHeadCalc() {
  const ft = Number(document.getElementById('testHeadFt')?.value);
  const sg = Number(document.getElementById('testSG')?.value);
  const base = Number(document.getElementById('testBasePsi')?.value);
  const out = document.getElementById('testHeadResult');
  if (!out) return;
  if (!Number.isFinite(ft) || !(sg > 0) || !Number.isFinite(base)) { out.textContent = 'Enter valid elevation, specific gravity and gauge pressure.'; return; }
  const head = ft * 0.433 * sg;
  out.innerHTML = `<b>Static head:</b> ${head.toFixed(2)} psi across ${ft.toFixed(1)} ft at SG ${sg.toFixed(3)}.<br><b>Estimated low-point gauge:</b> ${(base + head).toFixed(2)} psi if the entered gauge pressure is at the high point. This is hydrostatic head math only, not a required test-pressure calculation.`;
}
