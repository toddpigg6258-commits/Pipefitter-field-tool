from pathlib import Path
import json, math, html, re
from fractions import Fraction
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.graphics.shapes import Drawing, Line, String, Circle, PolyLine
from reportlab.graphics import renderPDF, renderSVG
REPO=Path(__file__).resolve().parents[1]
ROOT=REPO.parent
P=[]
def page(title,group,body,example=None,check=None,table=None,diagram=None,source=None):
 P.append(dict(title=title,group=group,body=body,example=example,check=check,table=table,diagram=diagram,source=source))
page('Pipefitter Field Guide','TEST EDITION 0.2',[
 'Math, layout and drawing checks for the Pipefitter Field Tool app.',
 'An original pocket guide built around a simple sequence: establish a datum, solve the geometry, account for the actual fittings, then check the finished layout.',
 'Includes worked examples, sixteenth-inch fractions, offset calculations, tee locations and dimension conventions. All example dimensions are invented for learning; they are not manufacturer fitting data.',
 'Expanded test edition • October 2026. Prepared for hands-on feedback. Technical review is still pending.'],diagram='tee')
page('Find it quickly','CONTENTS',['Choose a topic in the app reader, or use these page numbers in the PDF.'],table=[['Topic','Pages'],['Using this guide; dimension notation','3–4'],['Fractions, rounding and conversions','5–8'],['Field measurements and pipe identification','9–10'],['Triangles, offsets, rolling offsets and slope','11–16'],['Cut lengths, tees, flanges and valves','17–20'],['Tube bend geometry and clocking','21–22'],['ISO drawings and app controls','23–25'],['Spools, joining checks and work planning','26–29'],['Worked spool and glossary','30–31'],['Technical sources and edition notes','32']])
page('Use the right reference','START HERE',[
 'Use this guide to organize measurements and check layout arithmetic. A sketch, a dimension and a fitting catalog each answer a different question. Keep their purposes separate.',
 'The approved drawing defines the intended arrangement. The applicable specification and manufacturer documents identify acceptable components and installation requirements. This guide helps you connect those inputs without silently changing their meaning.',
 'Examples use ideal geometry. Real pipe ends, fittings, joints, supports and access clearances still have to be accounted for. A correct triangle does not prove that a spool will fit.',
 'This test edition is not a welding procedure, pressure-test procedure, engineering design or substitute for site training. Do not infer ratings, torque, wall thickness or allowable loading from its sketches.'],check='Before relying on a result, identify the dimension basis, units, source revision and person responsible for approval.')
page('Name both ends of a dimension','DIMENSION BASICS',[
 'C-C means center-to-center. E-E means end-to-end. F-F means face-to-face. C-F and C-E connect different reference types. Write down which physical points each letter represents on your particular sketch.',
 'A center may be the theoretical intersection of two pipe centerlines, not a point on the fitting surface. A face may be a flange sealing face; an end may be a prepared pipe end. These references are not interchangeable.',
 'Do not enter a face-to-face measurement into a cut-length calculation expecting a center-to-center value. Convert using the actual component dimensions first.',
 'Leader lines should terminate at the two intended reference points. Put dimension boxes away from crossings so another fitter can trace each value without guessing.'],example='If A is a tee center and B is a flange sealing face, label the span C-F. Record the flange and tee takeoffs separately; do not call that span C-C.',diagram='cut')
fractions=[['Fraction','Decimal in','Sixteenths']]+[[str(Fraction(n,16)),f'{n/16:.4f}',f'{n}/16'] for n in range(1,16)]
page('Fractions through sixteenths','MEASUREMENT',[
 'Read the whole inches first, then the fraction. The table contains every positive sixteenth below one inch, reduced to its familiar form.',
 'Converting 7/16 to decimal means dividing 7 by 16: 0.4375 in. A decimal such as 0.4375 is part of an inch, not part of a foot.'],table=fractions,check='A tape marked in sixteenths cannot justify reporting a measured length to a thousandth of an inch.')
page('Add and subtract cleanly','MEASUREMENT',[
 'Put fractions over the same denominator before combining them. Keep the feet and inches visible so a carry or borrow is not lost.',
 'For a long calculation, convert all lengths to inches, work at full precision, then convert the result back to feet and inches. Keep the original field measurement beside the converted value.',
 'A negative answer in a cut-length calculation is a signal to recheck the input references or the available space. It is not a usable pipe length.'],example='Addition: 2 ft 7-3/8 in + 1 ft 8-7/16 in.\nInches: 31-6/16 + 20-7/16 = 51-13/16.\nResult: 4 ft 3-13/16 in.\n\nSubtraction: 5 ft 2-1/4 in − 1 ft 9-5/8 in.\n62-2/8 − 21-5/8 = 40-5/8 in.\nResult: 3 ft 4-5/8 in.',check='Estimate first: about 31 + 20 is about 51 inches. A result near 5 inches or 500 inches needs correction.')
page('Round once, at the end','MEASUREMENT',[
 'Choose the reporting increment before the final conversion. To round a nonnegative inch value to the nearest 1/16 in, multiply by 16, round to the nearest whole number, then divide by 16.',
 'Keep full precision through intermediate trigonometry. Repeatedly rounding a travel, a takeoff and a remaining span can stack errors.',
 'Rounding is a reporting decision, not a fabrication tolerance. The permitted deviation comes from the job requirements. At an exact halfway point, follow the project rounding convention consistently.'],example='Calculated result: 17.386 in.\n17.386 × 16 = 278.176.\nNearest whole sixteenth: 278.\n278 ÷ 16 = 17.375 in = 17-3/8 in.\nRounding changed the value by 0.011 in.',check='Save the unrounded calculation in your notes when a later dimension depends on it.')
page('Keep units attached','MEASUREMENT',[
 'One inch equals 25.4 millimeters exactly. One foot equals 12 inches or 304.8 millimeters. These are conversion definitions, not estimates. [1]',
 'Convert a mixed feet-and-inches value to inches before multiplying by 25.4. Convert millimeters to inches by dividing by 25.4.',
 'A unit conversion does not change a product designation into an equivalent purchasable size. Check the specified pipe or tube system rather than selecting a component solely from a converted nominal label.'],example='3 ft 7-1/2 in = 43.5 in.\n43.5 × 25.4 = 1104.9 mm.\n\nFor 850 mm: 850 ÷ 25.4 = 33.4646… in.\nNearest 1/16 in: 33-7/16 in.',source='[1] NIST, SI Units – Length.')
page('Measure from one datum','FIELD LAYOUT',[
 'Choose a repeatable reference: a marked centerline, an established face or an approved elevation benchmark. Label it A and keep dimensions tied to it.',
 'Record what the tape actually touched. If you measure to the outside of a pipe but need its centerline, document the required geometric correction using the measured or specified outside diameter.',
 'Use an independent overall measurement to check a chain of smaller measurements. Record offsets in separate horizontal and vertical directions before combining them.',
 'Include obstruction envelopes, insulation space and maintenance access on the field sketch when required by the design. A centerline route alone does not describe all the space the assembly occupies.'],example='Datum-to-tee: 24 in. Tee-to-end: 72 in.\nExpected overall: 96 in.\nIf the independent overall is 97 in, reconcile the one-inch difference before cutting.',check='Write the date, drawing revision, instrument and any access limitation beside the survey.')
page('Identify the actual component','PIPE & FITTINGS',[
 'A nominal pipe-size label is an identifier, not a promise that the measured outside diameter equals the label. Record material, size designation, wall designation and connection type.',
 'For tubing, record the specified outside diameter and wall thickness. Do not substitute a pipe product merely because its description contains a similar number.',
 'Use the exact manufacturer dimensional drawing for the component being installed. Charlotte Pipe, for example, publishes dimensional catalogs for its own pressure pipe and fitting families. [2]',
 'Keep a component schedule: item tag, manufacturer, part number, material, size, end connections, required rating and dimensional source. Leave unknown values visibly unresolved instead of filling them from memory.'],check='No pressure/temperature ratings or universal fitting dimensions are reproduced in this guide.',source='[2] Charlotte Pipe, Pressure Dimensional Catalog.')
page('Solve the triangle first','GEOMETRY',[
 'Use a right triangle when two measured components are perpendicular. Name the perpendicular legs H and V, and the diagonal T.',
 'T = sqrt(H² + V²). If T and H are known, V = sqrt(T² − H²). A negative quantity inside the square root means the inputs or the assumed geometry do not agree.',
 'For an angle measured from H, sin(angle) = V/T and tan(angle) = V/H. Keep the calculator in degrees when using degree-marked pipe angles. [3]',
 'The triangle describes geometric separation. It does not include elbow center-to-end deductions or joint allowances.'],example='H = 12 in and V = 9 in.\nT = sqrt(144 + 81) = 15 in.\nCheck: the diagonal is longer than either leg.',diagram='triangle',source='[3] Right-triangle identities; independent example.')
page('Two-bend offset geometry','OFFSETS',[
 'For parallel entering and leaving centerlines, define O as the perpendicular offset. Let angle A be the direction change of each bend. T is the diagonal distance between the theoretical bend-center intersections, and R is the advance along the original run direction.',
 'From the right triangle: T = O / sin(A), and R = O / tan(A). These formulas apply to ideal centerline geometry with equal opposing bend angles.',
 'Choose the bend angle from the approved layout and available components. A small angle needs a longer travel and more run space. Actual fitting bodies and joint requirements must fit within that geometry.'],example='O = 10 in, A = 30°.\nT = 10 / 0.5 = 20 in.\nR = 10 / tan(30°) = 17.3205 in.\nThe 20 in travel is not the pipe cut length.',diagram='offset',check='Before using the formula, confirm the two entering/leaving runs really are parallel.')
rows=[['Bend angle','Travel × O','Advance × O']]+[[f'{a:g}°',f'{1/math.sin(math.radians(a)):.4f}',f'{1/math.tan(math.radians(a)):.4f}'] for a in [15,22.5,30,45,60]]
page('Offset factors you can check','OFFSETS',[
 'Multiply perpendicular offset O by the appropriate factor. These values were calculated directly from 1/sin(A) and 1/tan(A); they are not copied fitting dimensions.',
 'The factors are rounded for quick checking. For a final layout, calculate from the angle at full precision, then round the final reported dimension.',
 'Both answers have the same length unit as O. If O is in millimeters, travel and advance are in millimeters.'],table=rows,example='For O = 8 in at 22.5°:\nTravel ≈ 8 × 2.6131 = 20.9048 in.\nAdvance ≈ 8 × 2.4142 = 19.3136 in.',check='A 45° offset has advance equal to offset; its diagonal travel is about 1.4142 times the offset.')
page('Worked 45-degree offset','OFFSETS',[
 'Suppose the approved centerline offset is 18 in and the two direction changes are 45°. Establish the theoretical bend-center intersections on the sketch first.',
 'Calculate travel and advance before selecting a straight pipe cut. Then retrieve the actual takeoff along the travel leg for each fitting.',
 'Joint gaps in this example are invented for arithmetic practice, not a recommendation for any welding process. Real gaps come from the applicable procedure.'],example='Travel = 18 / sin(45°) = 25.4558 in.\nAdvance = 18 in.\n\nAssume verified travel-leg takeoffs of 4 in each, and two specified gaps of 1/8 in:\nCut = 25.4558 − 4 − 4 − 0.125 − 0.125\nCut = 17.2058 in, or 17-3/16 in to nearest 1/16.',check='Reconstruct the unrounded chain: cut + takeoff A + takeoff B + both gaps must equal travel.')
page('A rolling offset uses two triangles','ROLLING OFFSETS',[
 'A rolling offset moves sideways and changes elevation. First combine the two perpendicular offsets: true offset O = sqrt(side² + rise²). Then use O in the ordinary two-bend offset formula.',
 'Define the roll angle from the side/horizontal component toward the vertical component: roll = atan2(rise, side). State your viewing direction and sign convention so the assembly cannot be mirrored by accident.',
 'The roll angle orients the offset plane. It is not the elbow bend angle. Those two angles answer different questions.'],example='Side = 8 in, rise = 6 in.\nTrue offset = sqrt(64 + 36) = 10 in.\nRoll from the side axis = atan2(6,8) = 36.8699°.\nUsing 45° bends: travel = 10 / sin(45°) = 14.1421 in; advance = 10 in.',diagram='triangle',check='Check side and rise independently on the finished layout; the correct diagonal alone can still be in the wrong plane.')
page('Slope is rise over horizontal run','SLOPE',[
 'Slope = vertical change / horizontal run. Multiply that ratio by 100 to express percent slope. Keep both values in the same unit.',
 'An instruction stated as inches per foot describes vertical change for each foot of horizontal run. It is not degrees. The sloping pipe length is slightly longer than the horizontal run.',
 'Use only the slope specified for the system. The example below teaches arithmetic and does not prescribe a drainage or process-piping slope.'],example='Specified example: 1/4 in per ft for 16 ft.\nVertical change = 16 × 1/4 = 4 in.\nHorizontal run = 192 in.\nPercent = 4 / 192 × 100 = 2.0833%.\nSloping length = sqrt(192² + 4²) = 192.0417 in.',diagram='slope',check='Mark the high and low ends. Do not infer flow direction from the way a drawing happens to face.')
page('Build a dimensional chain','CUT LENGTHS',[
 'Start with a span whose reference points are explicit. Break it into every physical contribution between those points: fitting takeoffs, the pipe itself, required gaps, and any other specified pieces.',
 'For the simple butt-end example here: C-C span = takeoff A + gap A + pipe cut + gap B + takeoff B. Rearranging gives the pipe cut.',
 'Socket engagement, threads, flange faces and grooved connections use different physical reference points. Draw their chain instead of applying a universal deduction rule.',
 'Dimensions in a catalog may use different datums. Read the sketch and notes attached to the dimension, not just its letter.'],example='C-C = 48 in. Takeoffs = 4 in and 5 in.\nSpecified example gaps = 1/8 in at each end.\nCut = 48 − 4 − 5 − 1/8 − 1/8 = 38-3/4 in.',diagram='cut',check='Kerf is a stock-use allowance; it is not automatically a joint gap in the finished assembly.')
page('A tee creates separate sections','TEE LAYOUT',[
 'Give the two run sections and the branch separate identities. A tee center is a junction shared by those sections, not a floating symbol.',
 'If the straight run contains lengths L1 and L2 measured from its end references to the tee center, the tee fraction along that run is L1 / (L1 + L2). With several tees, use cumulative section lengths divided by the run total.',
 'That ratio controls a proportional drawing. Pipe cut lengths still need fitting takeoffs and the correct end references.',
 'When a tee moves on a sketch, inspect every connected branch, flange and nearby dimension. A visually connected line is not proof that all dimensions have been updated.'],example='Run total = 96 in; first section = 24 in.\nTee fraction = 24 / 96 = 0.25.\nThe tee belongs one quarter of the way along the run.\nFor 24, 30 and 42 in sections, tees lie at 25% and 56.25%.',diagram='tee')
page('Flanges: face, center and symbol','FITTING LAYOUT',[
 'A flange face is a physical reference surface. A flange symbol is only a drawing convention. Neither its line thickness nor its apparent width on screen provides a fabrication dimension.',
 'In this app, an end flange is drawn as one line across the pipe. The normal flange option is drawn with two lines. Confirm the drawing legend before treating those marks as a bill of materials.',
 'Record the actual flange type, size, material, class, facing and mating details from the specified component documents. Include required face-to-face space and gasket contributions in the correct dimensional chain.',
 'Bolt torque, gasket selection and assembly sequence are joint-specific. Use the approved joint assembly procedure rather than a generic number.'],check='If the field measurement reaches the sealing face, label it F. Do not silently move its reference to the flange back or pipe end.')
page('Valve layout includes access','FITTING LAYOUT',[
 'Record the valve tag and exact ordered model before using a face-to-face dimension. Different bodies, end connections and actuators can occupy different envelopes.',
 'Show intended orientation and any specified flow arrow. Include operator travel, actuator clearance and maintenance removal space in the layout review.',
 'Draw a dimension chain through the valve assembly using the actual ends or faces. Do not replace the valve with a guessed straight-pipe length in the cutting list.',
 'Keep the functional specification separate from the geometry: a valve that fits between two faces is not necessarily suitable for the fluid, temperature or required service.'],example='If an overall face-to-face envelope is 40 in and a verified valve assembly occupies 12 in of that chain, 28 in remains for the other components and specified joint contributions. That remainder is not automatically one pipe cut.',check='Confirm the valve can be operated and maintained after adjacent pipe is installed.')
page('Tube bends: geometry and tooling','TUBE LAYOUT',[
 'For an ideal circular centerline bend, use centerline radius R and bend angle A in degrees. Arc length B = pi × R × A / 180. The setback from a theoretical corner to a tangent point is S = R × tan(A/2).',
 'For two straight legs meeting at that corner, the ideal developed-length gain is G = 2S − B. This is geometric bookkeeping, not a universal bender deduct or arrow setting.',
 'Actual tooling marks and springback corrections depend on the bender, material and tube. Use the manufacturer instructions for the exact tool. [4]'],example='R = 3 in, A = 90°.\nS = 3 × tan(45°) = 3 in.\nB = pi × 3 × 90 / 180 = 4.7124 in.\nG = 6 − 4.7124 = 1.2876 in.',check='Keep CLR, outside radius and inside radius distinct. Do not use a pipe-fitting takeoff as a tubing bend radius.',source='[4] Swagelok tool guidance; equations and example independently developed.')
page('Clock the next bend','TUBE LAYOUT',[
 'A bend angle changes direction within a plane. Clocking rotates that plane around the tube axis before the next bend. Record both values.',
 'Choose a viewing direction, such as looking from the datum end toward the free end. Keep it fixed on the sketch and in the work sequence.',
 'Draw a reference stripe and number the bends in order. Note whether each measurement reaches a tangent, a theoretical center intersection or a finished end.',
 'Before forming the part, check that the chosen sequence can be held in the actual tool without interference. Manufacturer mark conventions take priority over a generic sketch.'],example='Bend record example: B1 = 45°, plane 0°. B2 = 45°, plane rotated 30° clockwise as viewed from datum A. The 30° plane rotation does not replace either 45° bend angle.',check='A mirrored part may have every individual length correct. Verify orientation with the marked datum still visible.')
page('Read an ISO as a map','DRAWINGS',[
 'An isometric drawing communicates connections and direction. Unless the drawing explicitly states otherwise, do not measure its printed line lengths with a ruler to obtain fabrication dimensions.',
 'Trace from a known datum or equipment connection. Number each straight section and identify every change of direction, junction, termination and component.',
 'At a crossing, check whether the lines actually join. A tee or connection mark is different from one line passing another.',
 'Keep the north arrow or orientation reference separate from the page edge. Confirm elevations, slope direction and branch orientation with the associated views.'],check='Before making a cut list, explain the complete route aloud from one end to the other. Every unexplained jump is a drawing question to resolve.')
page('Build the route in the app','APP PRACTICE',[
 'In ISO Drawing with PIPE LINE active, tap a start point, release, then tap the next point. Continue with separate taps to add sections.',
 'To branch, tap the body of an existing pipe. The app inserts a tee and splits the run into two sections. The next grid tap starts the branch from that junction.',
 'Tap an existing endpoint to make it the active drawing point. A one-finger swipe pans the view; two-finger pinch changes zoom. The view also follows newly added pipe near the viewport edge.',
 'Drag an endpoint toward an edge to extend the pipe while the view pans. Release to stop. Select END FLANGE for the single-line terminal symbol.'],example='Try a simple run, one tee, one branch and one end flange. Select each section in the list and check that the corresponding pipe highlights.',check='This edition describes the v87 drawing controls; report any phone-specific behavior that differs.')
page('Make dimensions easy to trace','APP PRACTICE',[
 'Select the intended pipe before editing its measurement. Check whether the value is C-C, E-E, C-F, F-F or C-E, and keep that basis on your field notes.',
 'Drag the dimension box to clear space. Its dark blue dotted lines should follow the box while their pipe ends stay on the section. There is no extra middle connector.',
 'Use DIM − or DIM + for size, FLIP DIM for the opposite side, and ROTATE DIM to change text orientation. Keep a little room between neighboring boxes.',
 'Changing measured straight-run section lengths repositions tees proportionally. Unmeasured sections use inferred drawing lengths until you enter real measurements; replace those estimates before fabrication.'],check='Trace both dotted endpoints for every label. A readable number attached to the wrong section is still an error.')
page('Prepare a spool record','SHOP HANDOFF',[
 'A useful spool record lets another person rebuild your reasoning. Include the spool identifier, line/service identifier, drawing revision, material and component schedule.',
 'For each section, record its reference-to-reference measurement, both fitting takeoffs, any specified joint contributions, the resulting cut length and the rounding increment.',
 'Keep the raw dimension and final cut in separate columns. Include the source for each non-geometric value, such as a manufacturer part drawing or approved procedure.',
 'Identify match marks and the viewing direction for clocked branches. Record which dimensions are verified, inferred or still awaiting confirmation.'],table=[['Section','Raw span','Cut','Source/status'],['S1','C-C 48 in','38-3/4 in','Example only'],['S2','C-F ___','___','Await face datum'],['S3','C-C ___','___','Verify branch plane']],check='Do not mark a spool ready solely because every cell contains a number.')
page('Joining details are not guesses','QUALITY CHECKS',[
 'Check the specified joint type before preparing a pipe end. Welding, threading, socket connections, grooving and mechanical couplings have different dimensional and assembly requirements.',
 'Keep component identification and traceability intact through layout and cutting as required by the project. Record substitutions through the established approval process.',
 'Pressure-test values, hold times, temperature limits, torque values and welding parameters do not appear in this guide. Retrieve them from the controlling system documents and approved procedures.',
 'An app calculation verifies arithmetic only. It cannot determine material compatibility, code acceptance or whether a field assembly is safe to energize.'],check='Pause the handoff when component markings, drawing callouts and the material record disagree. Resolve the discrepancy with the responsible person.')
page('Plan the work before opening a line','WORK PLANNING',[
 'Identify the actual service and hazards before work begins. Stored pressure, thermal energy and unexpected re-energization need the applicable site energy-control process. OSHA describes hazardous-energy controls for covered work; the governing requirements depend on the work and industry. [5]',
 'Hot work also requires control of ignition and exposure hazards. OSHA identifies fire, fumes and radiation among the hazards associated with welding and cutting. Use the applicable permit, supervision and protective measures. [6]',
 'This page is a planning prompt, not an isolation or hot-work procedure. Obtain the site-authorized instructions and trained personnel for the task.'],check='Confirm who authorizes the work, which system is involved, how its condition is verified, and which current procedure applies.',source='[5] OSHA hazardous energy overview. [6] OSHA welding hazards overview.')
page('Check the assembly before release','QUALITY CHECKS',[
 'Use independent measurements for the overall dimensions and branch locations. Confirm that the sum of the documented section chains agrees with the overall span.',
 'Review orientation, flange faces, valve access, connection types and any required slope against the approved layout.',
 'Make labels legible on the drawing and on the record. Note revision changes clearly so an older cut list cannot be mistaken for the current one.',
 'Leave unresolved items open. Completion of a drawing or an app checkbox is not acceptance of fabrication, inspection or testing. Record those approvals separately according to the project.'],table=[['Review item','Record'],['Overall dimensions','Checked by / date'],['Tee and branch positions','Datum / result'],['Faces and orientations','Drawing revision'],['Component identity','Schedule reference'],['Inspection or test status','Approved record ID']],check='Save a copy of the reviewed drawing with its revision and supporting measurements.')
page('Worked spool: two run sections','PUT IT TOGETHER',[
 'This practice spool has two straight run spans meeting at a tee. All takeoffs and joint gaps below are hypothetical values supplied for the exercise.',
 'Datum A to tee center = 30 in; tee center to datum B = 66 in. The total is 96 in, so the tee center should appear 31.25% of the way from A to B.',
 'S1 uses takeoffs of 4 in and 3 in with two 1/8 in gaps. S2 uses takeoffs of 3 in and 5 in with two 1/8 in gaps.'],example='S1 cut = 30 − 4 − 3 − 0.25 = 22.75 in.\nS2 cut = 66 − 3 − 5 − 0.25 = 57.75 in.\n\nCheck S1: 4 + 0.125 + 22.75 + 0.125 + 3 = 30.\nCheck S2: 3 + 0.125 + 57.75 + 0.125 + 5 = 66.\n\nEnter 30 in and 66 in as the run-section C-C values. Do not enter the cut lengths as C-C.',diagram='tee',check='The branch needs its own span and takeoff calculation; neither run-section result supplies its cut length.')
page('Working vocabulary','GLOSSARY',[],table=[['Term','Meaning in this guide'],['Datum','A stated reference for measurement.'],['Centerline','The geometric axis of a pipe or tube.'],['Takeoff','Distance from a stated fitting reference to its connection end or face.'],['Travel','Diagonal span in the offset triangle.'],['Advance','Span along the original run direction.'],['True offset','Combined perpendicular displacement in the offset plane.'],['Roll','Orientation of an offset plane.'],['CLR','Radius to the centerline of a circular bend.'],['Tangent','Where a straight centerline meets a bend arc.'],['Kerf','Material removed by the cutting process.'],['Spool','An identified assembly of pipe and components.'],['Witness line','Line tying a dimension to a reference point.']],check='Use the project legend when its terminology differs. State the definition beside an ambiguous measurement.')
SOURCES=[
 ('1','NIST: SI Units – Length','https://www.nist.gov/pml/owm/si-units-length'),
 ('2','Charlotte Pipe: Pressure Dimensional Catalog','https://www.charlottepipe.com/technical-hub/pressure-dimensional-catalog'),
 ('3','OpenStax: Right Triangle Trigonometry','https://openstax.org/books/precalculus-2e/pages/5-4-right-triangle-trigonometry'),
 ('4','Swagelok: Tube Fitter’s Manual resource','https://www.swagelok.com/en/resources/tube-fitting-manual'),
 ('5','OSHA: Control of Hazardous Energy','https://www.osha.gov/control-hazardous-energy'),
 ('6','OSHA: Welding, Cutting and Brazing Hazards','https://www.osha.gov/welding-cutting-brazing/hazards-solutions')]
page('Sources and edition notes','REFERENCE',[
 'This guide uses original explanations, independently calculated examples and newly drawn diagrams. It does not reproduce Audel text, page layouts, illustrations or tables. Sources below support unit definitions, basic geometry or direct readers to controlling technical information.',
 'Original chapters provide geometry and reference guidance. The practical supplement adds selected model-specific factual settings with attribution; it does not reproduce a complete manufacturer manual. Mention does not imply endorsement.',
 'Edition 0.2 is for app testing and technical review. Before commercial publication, have a qualified technical reviewer check the formulas, examples, terminology and scope. Confirm the final content and illustration rights, and record the reviewer and revision date.',
 'Sources checked October 9, 2026 (UTC).'],source='\n'.join(f'[{n}] {name}\n{url}' for n,name,url in SOURCES))
exec((REPO/'scripts/field-guide-practical.py').read_text())
TOTAL=len(P)
assert TOTAL==50,TOTAL
P[1]['table']=[['Topic','Pages'],['Basics, measurements and pipe geometry','3-22'],['Drawings, app controls and spool checks','23-31'],['Original sources and edition notes','32'],['Working formulas and circumferences','33-34'],['Weights, CG and sling tension','35-39'],['Torch setup and model-specific pressures','40-42'],['Pipe wraparound and folded paper','43-44'],['Saddle ordinates and worked templates','45-48'],['Practical supplement sources','49-50']]
P[0]['body'][2]='Includes worked formulas, rigging calculations, model-specific torch guidance, wraparound marking and folded-paper saddle development. Example dimensions are for training.'
NAVY='#10263d'; BLUE='#1e3a8a'; TEAL='#087e8b'; INK='#26374a'; MUTED='#596b7c'
def diagram(kind):
 d=Drawing(320,115)
 def line(x,y,X,Y,c=NAVY,w=3,dash=None):
  z=Line(x,y,X,Y,strokeColor=HexColor(c),strokeWidth=w)
  if dash:z.strokeDashArray=dash
  d.add(z)
 def label(x,y,t,c=MUTED,size=10):d.add(String(x,y,t,fontName='Helvetica',fontSize=size,fillColor=HexColor(c)))
 if kind=='cg':
  line(25,45,295,45);line(25,20,25,70,TEAL,2);line(295,20,295,70,TEAL,2);line(133,45,133,98,BLUE,2)
  label(12,7,'A: 600');label(251,7,'B: 400');label(105,100,'CG: 1000 lbf');label(58,63,'4 ft');label(197,63,'6 ft')
 elif kind=='sling':
  line(40,20,280,20);line(40,20,160,105,TEAL,3);line(280,20,160,105,TEAL,3);line(160,20,160,105,BLUE,1,[2,3])
  label(62,28,'A');label(98,70,'L');label(166,59,'H');label(125,3,'Load W');label(6,98,'A measured from horizontal',size=9)
 elif kind=='wrap':
  line(25,30,295,30);line(25,90,295,90);line(120,30,120,90,TEAL,3);line(190,30,190,90,TEAL,3)
  line(120,70,190,70,BLUE,1,[2,3]);label(116,100,'Square band');label(196,65,'Overlap flat',size=9);label(85,6,'Align the same long edge',size=9)
 elif kind=='stations':
  for y in [25,80]:line(15,y,303,y,TEAL,1)
  for k in range(17):
   x=15+18*k;line(x,25,x,80,BLUE,1,[2,2]);label(x-3,12,str(k),size=7)
  label(25,95,'16 panels = 16 equal arcs; seam is 0 / 16',size=9)
 elif kind=='saddle':
  vals=[math.sqrt(16-4*math.sin(k*math.pi/8)**2)-math.sqrt(12) for k in range(17)]
  line(15,20,303,20,BLUE,1)
  for k,v in enumerate(vals):
   x=15+18*k;y=20+v*110;line(x,20,x,y,BLUE,1,[2,2]);d.add(Circle(x,y,2,fillColor=HexColor(TEAL),strokeColor=HexColor(TEAL)))
  pts=[]
  for k in range(161):
   a=k*math.pi/80;pts.extend([15+1.8*k,20+(math.sqrt(16-4*math.sin(a)**2)-math.sqrt(12))*110])
  d.add(PolyLine(pts,strokeColor=HexColor(TEAL),strokeWidth=2))
  for k in [0,4,8,12,16]:label(12+18*k,6,str(k),size=8)
  label(52,96,'RETAIN ABOVE CURVE / WASTE BELOW',size=9)
 elif kind=='tee':
  line(22,60,298,60);line(105,60,105,106);d.add(Circle(105,60,4,fillColor=HexColor(TEAL),strokeColor=HexColor(TEAL)))
  for x in [22,105,298]:line(x,57,x,22,BLUE,1,[2,3])
  line(22,25,105,25,BLUE,1,[2,3]);line(105,25,298,25,BLUE,1,[2,3]);label(45,10,'L1');label(191,10,'L2');label(115,92,'Branch');label(14,72,'A');label(292,72,'B')
 elif kind in ('triangle','offset'):
  line(45,25,268,25,BLUE,1,[2,3]);line(268,25,268,96,BLUE,1,[2,3]);line(45,25,268,96)
  label(135,8,'H / advance');label(275,58,'V / O');label(127,76,'T / travel');label(82,32,'A')
  if kind=='offset':line(10,25,45,25);line(268,96,310,96)
 elif kind=='cut':
  line(20,60,300,60);line(70,48,70,72,TEAL,2);line(250,48,250,72,TEAL,2)
  for x in [20,70,250,300]:line(x,46,x,20,BLUE,1,[2,3])
  line(20,23,300,23,BLUE,1,[2,3]);label(22,83,'Reference A');label(231,83,'Reference B');label(115,40,'Pipe cut');label(22,8,'Takeoff A');label(243,8,'Takeoff B')
 elif kind=='slope':
  line(25,35,290,83);line(25,35,290,35,BLUE,1,[2,3]);line(290,35,290,83,BLUE,1,[2,3]);label(115,15,'Horizontal run');label(110,78,'Sloping length');label(250,100,'Rise')
 return d
style=ParagraphStyle('body',fontName='Helvetica',fontSize=10.2,leading=14.7,textColor=HexColor(INK),spaceAfter=9)
small=ParagraphStyle('small',parent=style,fontSize=8.1,leading=10.6)
# Dedicated 6 x 9 inch pocket format; one topic per physical page.
OUT=ROOT/'output/pdf/Pipefitter-Field-Guide-Test-Edition-02.pdf';OUT.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(OUT),pagesize=(432,648));c.setTitle('Pipefitter Field Guide - Test Edition 0.2');c.setAuthor('Pipefitter Field Tool')
def para(t,x,y,w,sty=style):
 p=Paragraph(html.escape(t).replace('\n','<br/>'),sty);_,h=p.wrap(w,1000);p.drawOn(c,x,y-h);return y-h-9
heights=[]
for i,p in enumerate(P,1):
 c.setFillColor(HexColor(NAVY));c.rect(0,631,432,17,fill=1,stroke=0)
 c.setFont('Helvetica-Bold',8);c.setFillColor(HexColor(TEAL));c.drawString(32,606,p['group'])
 title=Paragraph(html.escape(p['title']),ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=23,leading=25,textColor=HexColor(NAVY)))
 _,th=title.wrap(368,100);title.drawOn(c,32,589-th);y=577-th
 for t in p['body']:y=para(t,32,y,368)
 if p['diagram']:
  renderPDF.draw(diagram(p['diagram']),c,56,y-115);y-=124
 if p['table']:
  rows=[[Paragraph(html.escape(str(v)),small) for v in row] for row in p['table']]
  n=len(rows[0]); widths=([94,274] if n==2 else [122,122,124]) if n<4 else [70,99,90,109]
  table=Table(rows,colWidths=widths);table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),HexColor('#e8eef5')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LINEBELOW',(0,0),(-1,-1),.4,HexColor('#d7e0e8'))]))
  _,h=table.wrap(368,1000);table.drawOn(c,32,y-h);y-=h+12
 if p['example']:
  ex=Paragraph(html.escape(p['example']).replace('\n','<br/>'),ParagraphStyle('ex',parent=style,fontName='Helvetica',fontSize=9.8,leading=13.7))
  _,h=ex.wrap(344,1000);c.setFillColor(HexColor('#edf5f6'));c.roundRect(32,y-h-18,368,h+18,5,fill=1,stroke=0);ex.drawOn(c,44,y-h-9);y-=h+29
 if p['check']:
  y=para('FIELD CHECK  '+p['check'],32,y,368,ParagraphStyle('check',parent=small,textColor=HexColor(TEAL),fontName='Helvetica-Bold'))
 if p['source']: y=para(p['source'],32,y,368,ParagraphStyle('source',parent=small,fontSize=7.6,leading=10,wordWrap='CJK'))
 assert y>43,(i,p['title'],y)
 heights.append(y)
 if y>210 and p['group'] not in ('REFERENCE','CONTENTS','TEST EDITION 0.2'):
  c.setFont('Helvetica',7);c.setFillColor(HexColor(MUTED));c.drawString(32,138,'FIELD NOTES / TEST FEEDBACK')
  c.setStrokeColor(HexColor('#e2e9ef'))
  for note_y in (121,99,77):c.line(32,note_y,400,note_y)
 c.setStrokeColor(HexColor('#d7e0e8'));c.line(32,35,400,35);c.setFont('Helvetica',7);c.setFillColor(HexColor(MUTED));c.drawString(32,22,'PIPEFITTER FIELD TOOL  •  TEST EDITION 0.2');c.drawRightString(400,22,f'{i:02d} / {TOTAL}');c.showPage()
c.save()
# Same source content in a phone-friendly HTML reader, with real anchor navigation.
parts=[]
for i,p in enumerate(P,1):
 b=''.join('<p>'+html.escape(t)+'</p>' for t in p['body'])
 if p['diagram']:
  svg=renderSVG.drawToString(diagram(p['diagram']));b+=svg[svg.index('<svg'):]
 if p['table']:b+='<div class="table-wrap"><table>'+''.join('<tr>'+''.join(('<th>' if j==0 else '<td>')+html.escape(str(v))+('</th>' if j==0 else '</td>') for v in row)+'</tr>' for j,row in enumerate(p['table']))+'</table></div>'
 if p['example']:b+='<div class="example"><b>WORKED EXAMPLE</b><p>'+html.escape(p['example']).replace('\n','<br>')+'</p></div>'
 if p['check']:b+='<p class="check"><b>FIELD CHECK</b><br>'+html.escape(p['check'])+'</p>'
 if p['source']:
  src=html.escape(p['source']);src=re.sub(r'(https://[^\s<]+)',r'<a href="\1" target="_blank" rel="noopener">\1</a>',src)
  b+='<p class="source">'+src.replace('\n','<br>')+'</p>'
 parts.append(f'<article id="p{i}" data-page="{i}"><span class="eyebrow">{html.escape(p["group"])} · {i:02d} / {TOTAL}</span><h1>{html.escape(p["title"])}</h1>{b}</article>')
options=''.join(f'<option value="p{i}">{i:02d} · {html.escape(p["title"])}</option>' for i,p in enumerate(P,1))
web='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Pipefitter Field Guide</title><style>
*{box-sizing:border-box}body{margin:0;background:#e9eef3;color:#26374a;font:17px/1.6 system-ui,sans-serif}header{position:sticky;top:0;background:#10263d;color:white;padding:12px 16px;z-index:2}header strong{display:block;font-size:16px}nav{display:flex;gap:8px;margin-top:8px;align-items:center}select{min-width:0;flex:1;max-width:640px}select,button{font:inherit;min-height:44px;border:1px solid #a3b5c5;border-radius:6px;padding:6px;background:white;color:#10263d}button{cursor:pointer}header a{color:#cbe7ff;font-size:14px}main{max-width:760px;margin:auto;padding:16px}article{scroll-margin-top:135px;background:white;padding:clamp(18px,5vw,42px);margin:0 0 20px;border-radius:10px;box-shadow:0 2px 8px #10263d0d}h1{font-size:clamp(25px,5vw,34px);line-height:1.2;color:#10263d;margin:12px 0 22px}p{margin:0 0 17px}.eyebrow{color:#087e8b;font-size:12px;font-weight:800;letter-spacing:1px}svg{display:block;max-width:100%;height:auto;margin:24px auto}.example{padding:18px;background:#edf5f6;border-left:4px solid #087e8b;margin:20px 0;font-variant-numeric:tabular-nums}.example>b{font-size:12px;color:#087e8b}.example p{margin:8px 0 0}.check{color:#075d67}.source{font-size:12px;overflow-wrap:anywhere;color:#596b7c}.source a{color:#1e3a8a}.table-wrap{overflow-x:auto;margin:20px 0}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;vertical-align:top;padding:9px;border-bottom:1px solid #d7e0e8}th{background:#e8eef5}footer{text-align:center;padding:20px;font-size:13px}@media print{header{position:static}article{page-break-after:always;box-shadow:none}body{background:white}}
</style></head><body><header><strong>PIPEFITTER FIELD GUIDE · Test edition 0.2</strong><nav><button id="prev" aria-label="Previous topic">‹</button><select id="topics" aria-label="Choose a guide topic">OPTIONS</select><button id="next" aria-label="Next topic">›</button></nav><a href="./resources/Pipefitter-Field-Guide-Test-Edition-02.pdf" target="_blank" rel="noopener">Download the TOTAL_PAGES-page PDF</a></header><main>ARTICLES</main><footer>Original test edition · Technical review pending · October 2026</footer><script>
const topics=document.getElementById('topics');
function navigate(id){const page=document.getElementById(id);if(page){history.replaceState(null,'','#'+id);topics.value=id;page.scrollIntoView({behavior:'auto',block:'start'});document.getElementById('prev').disabled=id==='p1';document.getElementById('next').disabled=id==='pTOTAL_PAGES';}}
topics.addEventListener('change',()=>navigate(topics.value));
document.getElementById('prev').onclick=()=>navigate('p'+Math.max(1,Number(topics.value.slice(1))-1));
document.getElementById('next').onclick=()=>navigate('p'+Math.min(TOTAL_PAGES,Number(topics.value.slice(1))+1));
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
if(location.hash)requestAnimationFrame(()=>navigate(location.hash.slice(1)));else document.getElementById('prev').disabled=true;
const watcher=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){topics.value=e.target.id;document.getElementById('prev').disabled=e.target.id==='p1';document.getElementById('next').disabled=e.target.id==='pTOTAL_PAGES';}}, {rootMargin:'-140px 0px -55% 0px',threshold:0});
document.querySelectorAll('article').forEach(el=>watcher.observe(el));
</script></body></html>'''.replace('TOTAL_PAGES',str(TOTAL)).replace('OPTIONS',options).replace('ARTICLES',''.join(parts))
(REPO/'public/field-guide.html').write_text(web)
(REPO/'public/resources/Pipefitter-Field-Guide-Test-Edition-02.pdf').write_bytes(OUT.read_bytes())
(REPO/'scripts/field-guide-content.json').write_text(json.dumps({'edition':'0.2','pages':P,'sources':SOURCES},ensure_ascii=False,indent=2))
print(json.dumps({'pages':len(P),'minimum_bottom_y':round(min(heights),1),'pdf_bytes':OUT.stat().st_size,'html_bytes':len(web.encode()),'word_count':sum(len(' '.join(p['body']).split())+len((p['example'] or '').split()) for p in P)}))
