# Edition 0.3 cutting-specific replacement pages and practical pipefitter additions.
# Runs after original 50 pages. Original guide text and all new examples remain original.
P[0]['group'] = 'TEST EDITION 0.3'
P[0]['body'] = [
    'Pipefitter Field Guide: calculations, layouts, gas cutting, rigging and practical checks for the Pipefitter Field Tool app.',
    'Use a datum, identify actual sizes, solve the geometry, account for fittings and verify against approved work documents.',
    'Includes two clearly identified oxy-acetylene CUTTING-tip pressure charts (Harris V1-101 and Victor Type 101), not welding-tip settings.',
    'Expanded October 2026 test edition. Examples explain methods; use the marked equipment and its current instructions for live work.'
]
P[39].update(
 title='Oxy-acetylene CUTTING setup',
 group='CUTTING TORCH / NOT WELDING',
 body=[
  'These pages are for OXY-ACETYLENE CUTTING of suitable carbon steel, not fusion welding, heating or brazing. Cutting tips have a central cutting-oxygen jet plus preheat ports. Welding tips and fuel-gas substitutions use different data.',
  'Identify the exact cutting tip series and size marked on the tip. Verify compatible torch and attachment, oxygen and acetylene regulators, hose sizes, tip condition, flashback protection and required gas flow. Match that marked series to the correct chart; never average or mix charts.',
  'Secure cylinders upright; protect oxygen gear from oil and grease. Inspect hoses and connections, leak check and purge each gas separately according to the equipment manual. Observe hot-work controls, fire watch, ventilation and suitable PPE. [10,11]',
  'Delivery-pressure settings are read on the LOW-PRESSURE (working) gauges under the manufacturer-specified flow conditions. The cylinder contents gauges indicate supply pressure, NOT the setting to use. Never use acetylene above 15 psig. [10]'
 ],
 check='Before adjusting any regulator, confirm: fuel is ACETYLENE, tip type and size match the chart, and torch/cutting attachment is compatible.',
 source='[10] OSHA 1910.253. [11] Manufacturer oxygen-fuel setup guidance. Complete equipment manual governs use.'
)
P[40].update(
 title='CUTTING chart: Harris V1-101',
 group='ACETYLENE CUTTING PRESSURES',
 body=[
  'Harris V1-101 single-piece acetylene HAND-CUTTING tips for relatively clean steel, compatible with identified V-Series and Victor-style torches. Manufacturer chart PN 9700378 (08/2023), page 6. [15]',
  'The pressure columns are oxygen and acetylene delivery pressures in PSIG for CUTTING. They are NOT welding-tip settings. Values apply only to the exact tip series and compatible equipment. Recheck the current Harris data for torch, hose and required flow.'
 ],
 table=[
  ['Steel thickness in','Tip size','Oxygen psig','Acetylene psig'],
  ['To 1/8','000','20-30','5'],
  ['1/8 to 5/16','00','20-30','5'],
  ['5/16 to 5/8','0','30-40','7'],
  ['5/8 to 1','1','40-50','7'],
  ['1 to 2','2','45-55','8'],
  ['2 to 3','3','50-60','9'],
  ['3 to 4','4','60-75','10']
 ],
 check='For thicker cuts the source also lists size 5 (4-6 in: O2 70-80, acetylene 12) and size 6 (6 in: O2 75-80, acetylene 15); special hose requirements apply. Never exceed approved working pressure.',
 source='[15] The Harris Products Group, V1-101 general preheat acetylene cutting tips, PN 9700378, 08/2023, page 6. Selected facts re-tabulated, not a complete copy.'
)
P[41].update(
 title='CUTTING chart: Victor Type 101',
 group='ACETYLENE CUTTING PRESSURES',
 body=[
  'Victor Type 101 acetylene hand/machine CUTTING tip operating data from ESAB. This is a DIFFERENT series from Harris V1-101 and Smith SC12; do not interchange regulator settings. Values below are selected ESAB listings. [16]',
  'Oxygen column means CUTTING-oxygen pressure (psig); acetylene column means fuel-gas pressure (psig). ESAB also publishes separate PREHEAT-oxygen values, so check the full chart and the specific torch configuration.'
 ],
 table=[
  ['Steel thickness in','Tip size','Cut O2 psig','Acetylene psig'],
  ['1/4','00','20-25','3-5'],
  ['3/8','0','25-30','3-5'],
  ['1/2','0','25-30','3-5'],
  ['3/4','1','30-35','3-5'],
  ['1','2','40-45','3-7'],
  ['1-1/2','2','40-45','3-7'],
  ['2','3','40-45','4-9']
 ],
 check='ESAB also lists preheat O2 at 3-5 psig (1/4 and 3/8-1/2), 4-7 psig (3/4), 4-12 psig (1-1/2) and 5-14 psig (2). These are separate manufacturer torch values, not a third regulator on every torch.',
 source='[16] ESAB/Victor, Type 101 acetylene cutting tips, Operating Specifications. Selected rows reflect listed tip/part variants; consult the exact marked tip and the full source.'
)
P[48]['body'] = [
 'Practical sources identify the manufacturer cutting-tip series, rigging examples and measuring references. Cutting settings on pages 41-42 are distinct CUTTING-tip data, not welding instructions.',
 'Saddle ordinates are derived from the ideal intersection of perpendicular circular cylinders. Verify a paper trial and the actual OD on the job; reinforcement and bevel detail are not supplied by these equations.',
 'Illustrations and worked calculations in this guide are original. The linked manufacturer and standards publications govern ratings, pressure settings and approved procedures.'
]
P[49].update(
 title='Sources: oxy-fuel and layout',
 body=[
  'Use the current exact torch and cutting-tip documentation, rather than a setting from an unrelated tip or welding chart. The gas pressure seen on the delivery regulator may change under flow; follow the documented setup method.',
  'Pages 41 and 42 use selected values for Harris V1-101 and Victor Type 101 CUTTING equipment only. For other brands, tip series, fuels and metal thickness, obtain the matching current manufacturer chart.',
  'Smith SC12 is another acetylene cutting-tip family, not welding. It is not the chart used on these revised pages.'
 ],
 source='[10] OSHA 1910.253\nhttps://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.253\n[11] Miller safe oxy-fuel setup\nhttps://www.millerwelds.com/en-us/resources/knowledge-hub/welding-safety/10-steps-for-safe-oxy-fuel-torch-setup\n[15] Harris V1-101 cutting tips (PN 9700378)\nhttps://ch-delivery.lincolnelectric.com/api/public/content/bd29bc5b871a45aeb8ba5cf249542170?v=9a551e9d\n[16] Victor Type 101 cutting tips, ESAB\nhttps://esab.com/us/nam_en/products-solutions/product/gas-equipment/wear-parts/type-101-acetylene-cutting-tips/'
)

page('Cutting: what the cut is doing','CUTTING FIELD PRACTICE',[
 'A cutting attachment adds a high-purity cutting-oxygen jet through its center opening. Preheat flames bring carbon steel to the ignition condition; oxygen oxidizes the metal and blows oxide from the kerf. A welding tip does not provide that same jet.',
 'Square cuts depend on suitable tip size, clean orifices, constant stand-off, work surface condition, cutting-oxygen flow and a steady travel rate. A crooked kerf may be a tip, angle, oxygen-flow or travel-speed issue; diagnose from the manufacturer instructions.',
 'For pipe, mark the cut with a verified wraparound. Check the pipe is cold, isolated, cleaned and secured. Account for the kerf and any field-finishing allowance in cut length; never assume the cut face is an approved weld bevel.',
 'Follow the specific torch operating sequence for setup, light, cut, shutoff, separate bleeding and regulator release. Do not infer the sequence from this summary.'
],check='A suspected flashback, unstable flame, leak or damaged tip requires stopping work and using the documented response, not experimenting with pressure.',source='[10,11,15,16] Cutting and equipment-safety references.')

page('Nominal pipe size versus OD','PIPE SIZES',[
 'NPS is a designation, NOT the actual outside diameter for common sizes through NPS 12. Confirm pipe versus tubing before laying out a saddle, wraparound or support.',
 'These are common nominal wrought-steel pipe outside diameters in inches. Verify actual product, applicable ASME B36.10/B36.19 data and material specification; do not substitute nominal size for a measured OD.',
 'One nominal size may have several wall schedules. The outside diameter generally stays the same within a nominal size; the ID changes with wall thickness.'
],table=[['NPS','Actual OD in'],['1','1.315'],['1-1/2','1.900'],['2','2.375'],['3','3.500'],['4','4.500'],['6','6.625'],['8','8.625'],['10','10.750'],['12','12.750']],
 check='For NPS 4 pipe the circumference is pi × 4.500 = 14.137 in, not pi × 4 = 12.566 in.',source='[17] ASME B36.10/B36.19 size designation. Selected standard steel pipe OD values.')

page('Inside diameter and metal area','PIPE SIZES',[
 'Given actual OD D and measured or specified wall thickness t, the approximate inside diameter is d = D - 2t, provided t is positive and less than D/2.',
 'Flow opening area is Ai = pi × d²/4. Steel cross-section area is Am = pi × (D² - d²)/4. Units are square inches if diameters are inches.',
 'The schedule label alone does not give an ID until the actual product dimensions and corrosion or machining allowances are known. This geometric area is not a pressure rating.'
],example='Illustrative OD 4.500 in, wall 0.237 in.\nID = 4.500 - 2 × 0.237 = 4.026 in.\nFlow area = pi × 4.026² / 4 = 12.731 sq in (rounded).\nUse the actual wall in the specification for a production calculation.',check='Do not confuse inside flow area with the steel metal area needed for weight estimates.')

page('Parallel pipe and insulation clearance','LAYOUT IN THE RACK',[
 'For two bare round pipes of ODs D1 and D2, their minimum geometric centerline separation for just-touching outsides is (D1 + D2)/2. Add the required clear working space C to obtain centerline spacing S = (D1 + D2)/2 + C.',
 'If the lines have insulation thicknesses I1 and I2, use S = (D1 + D2)/2 + I1 + I2 + C. Add any further clearance required for flanges, valve operation, weld access, movement and support details.',
 'This is an envelope layout check, not a support design or thermal-movement analysis. Insulation can be removed locally for fittings; base spacing on the actual project arrangement.'
],example='6 in NPS pipe (OD 6.625) beside 4 in NPS pipe (OD 4.500).\nEach insulated 1.5 in radial thickness, with 2 in free gap required.\nS = (6.625+4.500)/2 + 1.5 + 1.5 + 2 = 10.5625 in center-to-center.',check='Confirm whether the specified clearance is between steel, insulation jacketing or projecting components.')

page('Bolt circles and equal bolt spacing','FLANGE LAYOUT',[
 'Let a flange bolt circle have diameter B and N evenly spaced holes. Adjacent hole center spacing measured straight across is the chord c = B × sin(180°/N). The circumference arc spacing is pi × B/N.',
 'A quick two-hole orientation has the top pair straddling the vertical centerline, if the drawing specifies that orientation. Actual clocking comes from the flange standard and project detail.',
 'The bolt circle is a layout dimension; it does not determine bolt size, flange rating, gasket selection or allowable torque. Use a verified flange template for drilling or machining.'
],example='Illustrative bolt circle B = 7.500 in, N = 8.\nAngle step = 360° / 8 = 45°.\nAdjacent chord = 7.5 × sin(22.5°) = 2.870 in (approx).\nArc between holes = pi × 7.5 / 8 = 2.945 in.',check='Check from the actual drawing whether the flange is to be two-holed, one-holed or clocked to another orientation.')

page('Flange assembly checks','FLANGE FIT-UP',[
 'Verify flange class, facing, gasket material, bolt grade and pipe specification from the approved isometric and line class. Align bolt holes and centerlines before bringing faces together.',
 'Check gasket location, face condition, parallelism and the specified gap or insertion condition. Do not use bolt tightening to pull an ill-fitting pipe or flange spool into position.',
 'Follow the approved gasket and joint procedure for tightening sequence, lubricants and target torque/tension. No generic torque chart is given here because bolt loading depends on joint design and materials.',
 'After assembly, document any flange mismatch, interference or gasket rework under the site quality process.'
],check='If flange faces will not mate without force, correct the fit-up rather than overloading the bolts.')

page('Concentric and eccentric reducers','REDUCER FIT-UP',[
 'Concentric reducers keep the large and small bore centerlines aligned. Eccentric reducers maintain a flat side and shift the smaller bore centerline relative to the larger bore.',
 'Mark which side is to remain flat from the approved drawing and flow/service requirement: some runs must drain from the low point, while some pump suction arrangements aim to avoid vapor pockets at the high point.',
 'Do not use a universal “flat on top” or “flat on bottom” rule. Elevation, flow direction, process fluid, vent/drain strategy and equipment nozzle geometry determine the correct arrangement.',
 'When inserting a reducer on an ISO drawing, record both end sizes, orientation and its end-to-end takeoff. The app inline symbol does not replace a manufacturer dimension.'
],check='Inspect the eccentric side in the installed view; a plan-only sketch can hide the actual flat-side orientation.')

page('Slope: fall over run','FIELD SLOPE',[
 'Slope is rise or fall divided by HORIZONTAL run. For a specified fall per foot q (in/ft), total fall (in) = q × horizontal run (ft). Do not multiply by the sloped pipe length.',
 'Percent grade = 100 × rise/run using the SAME units. Angle = arctan(rise/run); sloping travel length = sqrt(run² + rise²).',
 'Set a level datum and record upstream and downstream centerline elevations. Check all endpoints, vents, drains, high points and tie-ins before fabricating the spool.'
],example='Specified fall 1/8 in per foot across 24 ft horizontal.\nFall = 0.125 × 24 = 3.000 in.\nPercent grade = 100 × (3/288) = 1.0417%.\nAngle = arctan(3/288) ≈ 0.597°. \nPipe travel ≈ sqrt(288² + 3²) = 288.016 in.',check='Mark flow arrow and which end is HIGH. An undirected slope note is incomplete for layout.')

page('Field-cut chain and spool length','CUT LIST',[
 'Work from one approved centerline datum. List each component in order: elbows, tees, reducers, valves, flanges and straight pipe. Assign each its correct center-to-end or end-to-end takeoff.',
 'A straight cut length is the specified datum-to-datum distance minus applicable fitting takeoffs and deliberate joint allowances. Do not subtract takeoffs twice from a dimension already given end-to-end.',
 'Leave any bevel, root-gap, insertion, trim, shrink or field-fit allowance to the approved joint detail. A generic “weld shrinkage per joint” number is not reliable across pipe sizes and processes.'
],example='Illustrative center-to-center span = 72.000 in.\nFitting A center-to-end = 6.000 in; fitting B center-to-end = 4.500 in.\nNominal straight length = 72 - 6 - 4.5 = 61.500 in.\nApply project-specific end preparation and final cut requirements separately.',check='Record which dimensions are C-C, E-E, face-to-face or flange-face. Do not add allowances to an already defined finished piece.')

page('Field-spool verification list','QUALITY CHECKS',[
 'Before cutting: reconcile the latest ISO drawing, revision, line tag, NPS/OD, wall or schedule, grade, end preparation, fit-up allowance and datum. Walk the route and identify interferences and existing tie-ins.',
 'Before welding or bolting: identify component markings, weld IDs, orientation, valve flow direction, bolt clocking, branch takeoffs, clearances, support points and achievable access. Preserve any project-required traceability.',
 'Before handover: remeasure critical dimensions, flange face-to-face, centerline elevation, slope, branch orientation and valve access. Record approved field changes and close punch items in the job process.',
 'Use signed design drawings, welding procedures, inspection plans and client specifications for all quality decisions. This checklist is an organizing aid, not an acceptance code.'
],check='Capture one clearly labeled datum photo or marked sketch with the measured value and revision.')

page('Pressure-test preparation','TEST BOUNDARIES',[
 'Identify the approved test package, pressure boundary, temporary blinds, piping class, test medium, test pressure, hold criteria and responsible supervisor from the project procedure. This guide supplies no universal test pressure.',
 'Confirm vents, drains, supports, calibrated instruments, isolation from equipment not included in the test, and provisions for safely filling, pressurizing and depressurizing.',
 'Liquid testing may be preferable to pneumatic testing where permitted, but both require documented hazard controls. Never infer a safe pneumatic test or isolation scheme from a quick field calculation.',
 'Verify valve positions and temporary parts against the approved test boundary. Check removal of test blinds and reinstatement after authorized closeout.'
],check='Test execution and acceptance must follow the governing code, permits and approved site procedure.')

page('Everyday field math checks','FORMULA QUICK NOTES',[
 'Equal marks around pipe circumference: pitch = pi × actual OD / N. Angular increment = 360°/N. A wraparound reference line keeps the start mark consistent.',
 'Distance between two planar offset points: T = sqrt(R² + V²). If an angle from horizontal is known, V = T sin(A) and R = T cos(A). Enter angles in degrees.',
 'Pipe volume in gallons for a full straight round bore: Vgal = (pi × ID²/4 × L)/231, with ID and L in inches. Do not use the volume estimate for pressure design or isolation decisions.',
 'For a planar bolt circle, chord between adjacent holes = B sin(180°/N). All dimensions must use consistent units.'
],example='Illustrative ID = 4.000 in and length = 120 in.\nV = pi × 4²/4 × 120 = 1507.965 cubic in.\nVgal = 1507.965 / 231 = 6.528 gal (approx).\nThis excludes elbows, branches, fittings, headspace and drainage residues.',check='If a number looks wrong, estimate magnitude, check units and verify the actual pipe size before reworking it.')

page('Cutting and pipe-size references','REFERENCE',[
 'New edition 0.3 pages use selected factual values from clearly identified manufacturer cutting-tip charts. Their full current instructions govern all operating settings and limitations.',
 'The nominal pipe/OD lookup lists common standard steel-pipe dimensions for field arithmetic. ASME publications and the actual material documentation control tolerances, schedule and purchased size.',
 'This book provides reference calculations; it does not override engineered specifications, hot-work controls, rated lifting instructions, pressure-test plans or approved job procedures.'
],source='[15] Harris V1-101 cutting tip operating pressures, PN 9700378 (August 2023)\nhttps://ch-delivery.lincolnelectric.com/api/public/content/bd29bc5b871a45aeb8ba5cf249542170?v=9a551e9d\n[16] ESAB/Victor Type 101 acetylene CUTTING tips\nhttps://esab.com/us/nam_en/products-solutions/product/gas-equipment/wear-parts/type-101-acetylene-cutting-tips/\n[17] ASME B36.10 welded and seamless wrought steel pipe\nhttps://www.asme.org/codes-standards/find-codes-standards/welded-and-seamless-wrought-steel-pipe')

SOURCES.extend([
 ('15','Harris V1-101 acetylene CUTTING tip pressures','https://ch-delivery.lincolnelectric.com/api/public/content/bd29bc5b871a45aeb8ba5cf249542170?v=9a551e9d'),
 ('16','ESAB/Victor Type 101 acetylene CUTTING tips','https://esab.com/us/nam_en/products-solutions/product/gas-equipment/wear-parts/type-101-acetylene-cutting-tips/'),
 ('17','ASME B36.10 wrought steel pipe sizes','https://www.asme.org/codes-standards/find-codes-standards/welded-and-seamless-wrought-steel-pipe')
])
