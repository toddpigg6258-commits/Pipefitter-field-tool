# Append practical layout instructions without changing established page anchors.
P[0]['group'] = 'TEST EDITION 0.4'
P[0]['body'].append('New practical layout section: straight reference lines with angle iron or strut, framing-square top marks, and eccentric reducer orientation (pages 64-69).')

page('Straight lines with angle iron','PRACTICAL LAYOUT / 1',[
 '1. Support and block the pipe so it cannot roll. Clean the marking area and contact surfaces. Check the angle against a known straight edge; reject bent, twisted or burred stock.',
 '2. Establish the starting reference mark. If the line must represent installed top, find top first (page 66). An arbitrary straight line does not establish top or elevation.',
 '3. Place the angle lengthwise with its open inside corner over the pipe. Both inside faces must contact the pipe along its length. Choose legs long enough to seat properly on the pipe diameter.',
 '4. Rotate the angle around the pipe until one accessible marking edge passes through the reference mark. Keep both faces seated; do not twist one end to force alignment.',
 '5. Hold or secure the angle without moving the pipe. Draw a thin line along the same edge. Keep the marker upright and use a material-compatible marker.',
 '6. For a longer run, overlap the previous line at two separated points before extending it. Recheck against an independently established end mark.'
],check='Rocking, a raised weld seam or a dent can lift one contact face and skew the line. Reposition and verify; do not bridge an obstruction and assume accuracy.',source='Layout background: U.S. Navy Steelworker, Volume 2, Chapter 3; see page 69 for references.')

page('Straight lines with strut','PRACTICAL LAYOUT / 2',[
 '1. Use a straight, untwisted piece of channel strut. Remove nuts, brackets and debris. Inspect both lips for damage and check the proposed marking edge for straightness.',
 '2. With the pipe blocked, place the open channel toward the pipe. Both longitudinal lips must bear evenly on the curved surface. A small pipe may enter the channel and touch the web instead: that strut size is unsuitable.',
 '3. Check seating at both ends and the middle. Press lightly from side to side: rocking or a visible gap means you do not have a dependable reference.',
 '4. Align one continuous marking edge with the established reference mark. Keep the channel parallel to the pipe axis with both lips seated. Do not use slot edges as a marking guide.',
 '5. Mark along the same straight edge, then lift and reseat the strut to check repeatability. If the new position does not agree, resolve seating, straightness or pipe-shape problems before cutting.',
 '6. Extend in overlapping lengths, matching the existing line at two separated points. Confirm the far end against a second reference mark.'
],check='Strut is a field straightedge, not a calibrated center finder. Use suitable angle iron or a purpose-made pipe layout tool if the lips cannot seat evenly. Neither tool establishes a square cut around the pipe.')

page('Find top with a framing square','PRACTICAL LAYOUT / 3',[
 '1. Use this method on a straight, round, horizontal pipe. Block it against rolling and check its axis with a level. For sloped pipe, use a suitable center finder or an approved survey method.',
 '2. Check the square for squareness and the level by reversing it on the same reference surface. Clean the pipe and square. Use actual outside diameter (OD), not nominal pipe size.',
 '3. Hold the square in a cross-section plane, perpendicular to the pipe axis. Put the inside horizontal edge against the crown and the inside vertical edge against one side. Both edges must be tangent to the pipe.',
 '4. Level the horizontal leg while keeping both contacts seated. From the inside corner, measure OD / 2 along that horizontal leg toward the pipe center. Read from the true corner, not an offset scale zero.',
 '5. Mark the pipe directly beneath that position. This is the 12 o’clock point for the present installed orientation. Repeat at another station without allowing the pipe to roll.'
],example='Example: actual OD = 4.500 in.\nHalf OD = 2.250 in = 2-1/4 in from the inside corner.\nUsing nominal 4 in would put the mark 1/4 in off.',check='Repeat from the opposite side: top marks should agree within the job tolerance. Recheck level, square position and roundness if they do not.',source='[18] U.S. Navy Steelworker, Volume 2, Figure 3-42 (reference on page 69).')

page('Transfer and preserve top marks','PRACTICAL LAYOUT / 4',[
 '1. Establish top independently at two separated cross sections using page 66. Mark each point and label the intended installed top before moving the pipe.',
 '2. Connect those marks using the angle-iron or strut method. If the edge cannot pass through both marks while seated, investigate the pipe and the marks; do not force the tool.',
 '3. To obtain side and bottom references, wrap a nonstretch strip squarely around the pipe, align its overlapping edges and mark one exact circumference. Remove it and divide that circumference into four equal parts.',
 '4. Refit the strip with its zero at your top mark. Transfer quarter, half and three-quarter circumference marks: 3, 6 and 9 o’clock when viewed from your declared reference end. Carry those marks lengthwise as needed.',
 '5. Add a viewing-direction arrow or name the reference end so another fitter cannot reverse left and right. Label the datum and spool identification outside the cut area.',
 '6. If the pipe is rolled for welding, the mark still identifies intended installed top; it is no longer necessarily gravity top. Restore the documented orientation before checking slope and branch clocking.'
],check='Use a wraparound for a square circumferential line. A longitudinal straightedge and a circumferential wrap establish different references; check both before transferring a saddle or branch layout.')

page('Choose reducer orientation','PRACTICAL LAYOUT / 5',[
 '1. Confirm the fitting is eccentric, and check both sizes, material, wall/end preparation and the drawing revision. Its end centerlines are offset; a concentric reducer has a common centerline.',
 '2. Read the specified clocking and elevation basis: flat on top (FOT), flat on bottom (FOB), or another orientation. If absent or conflicting, obtain the design clarification before fit-up.',
 '3. For horizontal liquid pump suction, an eccentric reducer is commonly arranged flat on top to avoid an air pocket. Check the entire suction profile and the specific pump instructions; this is not a universal rule for every inlet arrangement.',
 '4. Flat on bottom can preserve a specified bottom elevation. Pump inlet geometry, drainage and solids service require the approved design; do not choose orientation from a slogan.',
 '5. Check flow direction, adjoining elbows, slope, vents/drains and the path air or liquid must take. Avoid creating an unintended local high or low pocket.',
 '6. Identify the flat side with a straightedge along the reducer profile, allowing for weld bevels and end lands. Mark that side and the required installed top before assembly.'
],check='Flat side is not the same as a common centerline. Do not pull connected equipment into alignment to accommodate a wrongly clocked reducer.',source='[19] KSB, Centrifugal Pump Lexicon: Fitting. Reference link on page 69; equipment-specific installation instructions govern.')

page('Fit and verify the reducer','PRACTICAL LAYOUT / 6',[
 '1. Establish the installed top reference on both adjoining pipes. Support them at the specified elevations and slope. Transfer clocking marks to the reducer.',
 '2. Dry-fit to the drawing. Check end-to-end length and the actual fitting offset from its dimensional data. For ideal matching external flat profiles, centerline offset is (large OD - small OD) / 2; verify the manufactured fitting.',
 '3. Check the designated flat profile with a straightedge and the required slope with a level or survey. Flat on top describes clocking; it does not cancel a specified line slope. An external check does not prove internal drainage where walls differ.',
 '4. Verify root gap, internal mismatch and end preparation against the WPS and project requirements. Check flange clocking, nozzle alignment and support contact without forcing the joint.',
 '5. Tack only under the approved procedure, then recheck clocking, elevations, slope and joint alignment. Repeat critical checks after welding and before release.'
],check='Record reducer orientation on the spool sketch. Resolve unintended air or liquid pockets with the designer before final assembly.',source='[18] U.S. Navy Steelworker, Vol. 2, Figure 3-42 (public reprint)\nhttps://constructionmanuals.tpub.com/14251/css/Quartering-the-Pipe-100.htm\n[19] KSB, Fitting / reducers for avoiding air pockets\nhttps://www.ksb.com/en-global/centrifugal-pump-lexicon/f')

SOURCES.extend([
 ('18','U.S. Navy Steelworker Vol. 2: top and side quarter points','https://constructionmanuals.tpub.com/14251/css/Quartering-the-Pipe-100.htm'),
 ('19','KSB: Fitting / avoiding air pockets','https://www.ksb.com/en-global/centrifugal-pump-lexicon/f')
])
