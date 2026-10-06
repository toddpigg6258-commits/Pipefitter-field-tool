function toolFillPipeSizes(selectId) {
  let select = $(selectId);
  select.innerHTML = '';
  orderedPipeSizes(Object.keys(OD)).forEach(size => select.add(new Option(size + '\"', size)));
  if ([...select.options].some(option => option.value === '4')) select.value = '4';
}

function initFieldTools() {
  ['toolWrapSize', 'toolElevSize', 'toolMiterSize', 'toolSpecialSize'].forEach(toolFillPipeSizes);
  bindMeasureInput('toolElevCL', 'Centerline elevation');
  bindMeasureInput('toolSlopeRun', 'Slope run');
  bindMeasureInput('toolSlopeRise', 'Slope rise');
  bindMeasureInput('toolVolLen', 'Pipe length');
  bindMeasureInput('toolMiterRadius', 'Miter centerline radius');
  bindMeasureInput('toolAnyOffset', 'Any-angle offset');
  bindMeasureInput('toolBoltBcd', 'Bolt circle diameter');
  bindMeasureInput('toolSquareLength', 'Square check length');
  bindMeasureInput('toolSquareWidth', 'Square check width');
  bindMeasureInput('toolSpecialOffset', 'Special offset rise');
  bindMeasureInput('toolSpecialRadius', 'Special offset elbow CLR');
  bindMeasureInput('toolSpreadSpacing', 'Equal spread pipe spacing');
  bindMeasureInput('toolSpreadBase', 'Equal spread reference center-to-face');
  bindMeasureInput('sadEcc', 'Saddle centerline offset');
  try {
    $('toolScratch').value = localStorage.pf_field_scratch || '';
  } catch {}
  toolWrapCalc();
  $('toolElevOut').innerHTML = 'Enter a centerline elevation.';
  $('toolSlopeOut').innerHTML = 'Enter run plus rise, or run plus percent grade.';
  $('toolVolOut').innerHTML = 'Enter actual inside diameter and pipe length.';
  toolAnyOffsetCalc();
  toolBoltCircleCalc();
  toolSquareCalc();
  toolMiterCalc();
  toolSpecialOffsetCalc();
  toolEqualSpreadCalc();
}

function toolWrapCalc() {
  let size = $('toolWrapSize').value,
    od = OD[size],
    degrees = parseFloat($('toolWrapDeg').value),
    divisions = parseInt($('toolWrapDivs').value, 10);
  if (!(od > 0) || !isFinite(degrees) || degrees < 0 || degrees > 360 || !(divisions > 0)) {
    $('toolWrapOut').innerHTML = 'Check pipe size, degree mark and divisions.';
    return;
  }
  let circumference = Math.PI * od,
    degreeDistance = circumference * degrees / 360,
    spacing = circumference / divisions,
    marks = [];
  for (let i = 0; i < divisions; i++) {
    let angle = i * 360 / divisions,
      distance = i * spacing;
    marks.push('<div class="tool-mark"><b>' + angle.toFixed(angle % 1 ? 1 : 0) + '°</b><br>' + fmtIn(distance) + ' from 0</div>');
  }
  $('toolWrapOut').innerHTML =
    '<div><span class="muted">Pipe OD</span><br><b>' + fmtIn(od, 16) + '</b></div>' +
    '<div><span class="muted">Circumference</span><br><b>' + fmtIn(circumference) + '</b></div>' +
    '<div><span class="muted">' + degrees + '° mark from zero</span><br><b>' + fmtIn(degreeDistance) + '</b></div>' +
    '<div><span class="muted">Equal mark spacing</span><br><b>' + fmtIn(spacing) + '</b></div>' +
    '<div class="tool-mark-list">' + marks.join('') + '</div>';
}

function toolElevationCalc() {
  try {
    let size = $('toolElevSize').value,
      cl = valMeasure('toolElevCL'),
      od = OD[size];
    if (cl == null) throw Error('Enter centerline elevation');
    result('toolElevOut', [
      ['Top of pipe', fmtFeet(cl + od / 2)],
      ['Centerline', fmtFeet(cl)],
      ['Bottom of pipe', fmtFeet(cl - od / 2)],
      ['Pipe OD used', fmtIn(od, 16)],
    ]);
  } catch (error) {
    $('toolElevOut').innerHTML = error.message;
  }
}

function toolSlopeCalc() {
  try {
    let run = valMeasure('toolSlopeRun'),
      rise = valMeasure('toolSlopeRise'),
      percent = parseFloat($('toolSlopePct').value);
    if (!(run > 0)) throw Error('Enter a run greater than zero');
    if (rise != null) {
      let ratio = rise / run,
        pct = ratio * 100,
        inchPerFoot = ratio * 12,
        angle = Math.atan(ratio) * 180 / Math.PI;
      result('toolSlopeOut', [
        ['Rise', fmtFeet(rise)],
        ['Run', fmtFeet(run)],
        ['Slope', pct.toFixed(3) + '%'],
        ['Pitch', inchPerFoot.toFixed(4) + '&quot; per ft'],
        ['Angle', angle.toFixed(3) + '°'],
      ]);
      return;
    }
    if (!isFinite(percent)) throw Error('Enter rise or percent grade');
    let requiredRise = run * percent / 100,
      inchPerFoot = percent / 100 * 12,
      angle = Math.atan(percent / 100) * 180 / Math.PI;
    result('toolSlopeOut', [
      ['Required rise', fmtFeet(requiredRise)],
      ['Run', fmtFeet(run)],
      ['Slope', percent.toFixed(3) + '%'],
      ['Pitch', inchPerFoot.toFixed(4) + '&quot; per ft'],
      ['Angle', angle.toFixed(3) + '°'],
    ]);
  } catch (error) {
    $('toolSlopeOut').innerHTML = error.message;
  }
}

function toolVolumeCalc() {
  try {
    let insideDiameter = parseFloat($('toolVolID').value),
      length = valMeasure('toolVolLen');
    if (!(insideDiameter > 0)) throw Error('Enter the actual inside diameter');
    if (!(length > 0)) throw Error('Enter pipe length');
    let cubicInches = Math.PI * insideDiameter * insideDiameter / 4 * length,
      gallons = cubicInches / 231,
      cubicFeet = cubicInches / 1728,
      liters = cubicInches * 0.016387064;
    result('toolVolOut', [
      ['Pipe length', fmtFeet(length)],
      ['Inside diameter', insideDiameter.toFixed(3) + '&quot;'],
      ['US gallons', gallons.toFixed(3) + ' gal'],
      ['Cubic feet', cubicFeet.toFixed(4) + ' ft³'],
      ['Liters', liters.toFixed(2) + ' L'],
    ]);
  } catch (error) {
    $('toolVolOut').innerHTML = error.message;
  }
}

function toolAnyOffsetCalc() {
  try {
    const offset = valMeasure('toolAnyOffset');
    const angle = parseFloat($('toolAnyAngle').value);
    if (!(offset >= 0)) throw Error('Enter an offset');
    if (!(angle > 0 && angle < 90)) throw Error('Enter an angle above 0° and below 90°');
    const radians = angle * Math.PI / 180;
    const travelMultiplier = 1 / Math.sin(radians);
    const setbackMultiplier = 1 / Math.tan(radians);
    result('toolAnyOffsetOut', [
      ['Offset', fmtFeet(offset)],
      ['Angle', angle.toFixed(3) + '°'],
      ['Travel', '<span class="big">' + fmtFeet(offset * travelMultiplier) + '</span>'],
      ['Setback / advance', '<span class="big">' + fmtFeet(offset * setbackMultiplier) + '</span>'],
      ['Travel multiplier', travelMultiplier.toFixed(4)],
      ['Setback multiplier', setbackMultiplier.toFixed(4)],
    ]);
  } catch (error) {
    $('toolAnyOffsetOut').innerHTML = error.message;
  }
}

function toolBoltCircleCalc() {
  try {
    const bcd = valMeasure('toolBoltBcd');
    const holes = parseInt($('toolBoltHoles').value, 10);
    if (!(bcd > 0)) throw Error('Enter the actual bolt circle diameter');
    if (!(holes >= 2)) throw Error('Enter at least 2 holes');
    const degrees = 360 / holes;
    const chord = bcd * Math.sin(Math.PI / holes);
    const radius = bcd / 2;
    const halfStep = 180 / holes;
    result('toolBoltCircleOut', [
      ['Bolt circle diameter', fmtFeet(bcd)],
      ['Hole count', String(holes)],
      ['Degrees between holes', degrees.toFixed(3) + '°'],
      ['Adjacent hole-center chord', '<span class="big">' + fmtFeet(chord) + '</span>'],
      ['Bolt circle radius', fmtFeet(radius)],
      ['Half-step angle', halfStep.toFixed(3) + '°'],
      ['Straddle-centerline shortcut', 'If the job calls for holes straddling a reference centerline, the first hole center is one half-step from that line.'],
    ]);
  } catch (error) {
    $('toolBoltCircleOut').innerHTML = error.message;
  }
}

function toolSquareCalc() {
  try {
    const length = valMeasure('toolSquareLength');
    const width = valMeasure('toolSquareWidth');
    if (!(length > 0) || !(width > 0)) throw Error('Enter both length and width');
    const diagonal = Math.hypot(length, width);
    result('toolSquareOut', [
      ['Length', fmtFeet(length)],
      ['Width', fmtFeet(width)],
      ['Corner-to-corner diagonal', '<span class="big">' + fmtFeet(diagonal) + '</span>'],
      ['Half diagonal', fmtFeet(diagonal / 2)],
      ['Square check', 'Both diagonals should match when the frame / rack is square.'],
    ]);
  } catch (error) {
    $('toolSquareOut').innerHTML = error.message;
  }
}

function toolMiterCalc() {
  try {
    let desiredAngle = parseFloat($('toolMiterAngle').value),
      size = $('toolMiterSize').value,
      pipeOd = OD[size],
      elbowType = $('toolMiterType')?.value || 'LR90',
      cutMode = $('toolMiterCutMode')?.value || 'ONE_END',
      radius = elbowType === 'CUSTOM' ? valMeasure('toolMiterRadius') : BW[elbowType]?.inch?.[size];
    if (!(desiredAngle > 0 && desiredAngle <= 90)) throw Error('Enter the finished elbow angle from above 0° through 90°');
    if (!(pipeOd > 0)) throw Error('Choose a valid pipe size');
    if (!(radius > 0)) throw Error(elbowType === 'CUSTOM' ? 'Enter the actual centerline radius for this elbow.' : 'No loaded 90° center-to-end is available for this size/type.');
    if (radius <= pipeOd / 2) throw Error('Elbow centerline radius must be greater than half the pipe OD.');
    let totalRemoved = 90 - desiredAngle,
      trimAngle = cutMode === 'ONE_END' ? totalRemoved : totalRemoved / 2,
      trimRadians = trimAngle * Math.PI / 180,
      desiredRadians = desiredAngle * Math.PI / 180,
      pipeRadius = pipeOd / 2,
      layoutRadians = cutMode === 'ONE_END' ? desiredRadians : trimRadians,
      heelMark = (radius + pipeRadius) * layoutRadians,
      sideMark = radius * layoutRadians,
      throatMark = (radius - pipeRadius) * layoutRadians,
      fieldCutTakeout = radius * Math.tan(desiredRadians / 2),
      takeoutReduction = radius - fieldCutTakeout,
      remainingArc = radius * desiredRadians,
      typeLabel = elbowType === 'LR90' ? '90° LR butt-weld elbow' : elbowType === 'SR90' ? '90° SR butt-weld elbow' : 'Custom-radius 90° elbow',
      methodLabel = cutMode === 'ONE_END' ? 'KEEP ONE FACTORY END — measure the finished piece' : 'ADVANCED — equal trim both ends',
      rows = [
        ['Start fitting', size + '&quot; NPS • ' + typeLabel],
        ['Pipe OD', fmtIn(pipeOd, 16)],
        ['90° center-to-end A / CLR', '<span class="big">' + fmtIn(radius) + '</span>'],
        ['Finished elbow angle', desiredAngle.toFixed(3) + '°'],
        ['Cut method', methodLabel],
        ['Angle removed / scrap side', totalRemoved.toFixed(3) + '°'],
        ['Finished field-cut takeout', '<span class="big">' + fmtIn(fieldCutTakeout) + '</span>'],
        ['TAKEOUT CUTBACK — shorten the original 90° takeout by', '<span class="big">' + fmtIn(takeoutReduction) + '</span>'],
        ['REFERENCE / ZERO', cutMode === 'ONE_END' ? '<b>Use the factory bevel on the piece you are KEEPING as zero.</b>' : 'Equal-trim mode measures the same trim from both original bevels.'],
        [cutMode === 'ONE_END' ? 'HEEL — kept bevel to NEW CUT' : 'HEEL / OUTSIDE trim mark', '<span class="big">' + fmtIn(heelMark) + '</span>'],
        [cutMode === 'ONE_END' ? 'SIDE #1 — kept bevel to NEW CUT' : 'SIDE mark #1', fmtIn(sideMark)],
        [cutMode === 'ONE_END' ? 'THROAT — kept bevel to NEW CUT' : 'THROAT / INSIDE trim mark', '<span class="big">' + fmtIn(throatMark) + '</span>'],
        [cutMode === 'ONE_END' ? 'SIDE #2 — kept bevel to NEW CUT' : 'SIDE mark #2', fmtIn(sideMark)],
        ['What these four numbers mean', cutMode === 'ONE_END' ? 'Every number is measured on the elbow section you KEEP. Mark those four distances from the kept factory bevel, then connect HEEL → SIDE → THROAT → SIDE. The material past that line toward the other original end is SCRAP.' : 'Advanced equal-trim mode uses trim-off distances from both original ends.'],
        ['Finished centerline arc on kept piece', fmtIn(remainingArc)],
        ['Takeout formula', 'Field-cut takeout = A × tan(finished angle ÷ 2).'],
        ['Kept-piece surface formula', cutMode === 'ONE_END' ? 'For finished angle θ: heel = (CLR + OD/2) × θ • side = CLR × θ • throat = (CLR − OD/2) × θ, with θ in radians.' : 'For equal trim angle φ: heel = (CLR + OD/2) × φ • side = CLR × φ • throat = (CLR − OD/2) × φ, with φ in radians.'],
        ['Field check', 'Verify the actual fitting dimensions and cut plane before cutting; re-bevel the new weld end to the project welding procedure.'],
      ];
    result('toolMiterOut', rows);
  } catch (error) {
    $('toolMiterOut').innerHTML = error.message;
  }
}

function toolSpecialOffsetCalc() {
  try {
    const desiredOffset = valMeasure('toolSpecialOffset');
    const size = $('toolSpecialSize').value;
    const pipeOd = OD[size];
    const elbowType = $('toolSpecialType').value;
    const radius = elbowType === 'CUSTOM' ? valMeasure('toolSpecialRadius') : BW[elbowType]?.inch?.[size];
    if (!(desiredOffset > 0)) throw Error('Enter the desired rise / offset.');
    if (!(pipeOd > 0)) throw Error('Choose a valid pipe size.');
    if (!(radius > pipeOd / 2)) throw Error(elbowType === 'CUSTOM' ? 'Enter an actual CLR greater than half the pipe OD.' : 'No usable CLR is loaded for this size and elbow type.');
    const maximumOffset = 2 * radius;
    if (desiredOffset > maximumOffset + 1e-8) throw Error('Two touching 90° elbows with this CLR can make at most ' + fmtIn(maximumOffset) + ' of offset. Add straight pipe between fittings or use a larger CLR.');
    const cosine = Math.max(-1, Math.min(1, 1 - desiredOffset / (2 * radius)));
    const elbowAngle = Math.acos(cosine) * 180 / Math.PI;
    const elbowRadians = elbowAngle * Math.PI / 180;
    const cutFrom90 = 90 - elbowAngle;
    const pipeRadius = pipeOd / 2;
    const heelMark = (radius + pipeRadius) * elbowRadians;
    const sideMark = radius * elbowRadians;
    const throatMark = (radius - pipeRadius) * elbowRadians;
    const takeout = radius * Math.tan(elbowRadians / 2);
    const advance = 2 * radius * Math.sin(elbowRadians);
    const typeLabel = elbowType === 'LR90' ? 'LR 90° BW elbows' : elbowType === 'SR90' ? 'SR 90° BW elbows' : 'custom-CLR 90° elbows';
    result('toolSpecialOffsetOut', [
      ['Setup', 'Two matching ' + typeLabel + ' welded directly together • no straight pipe between'],
      ['Desired offset / rise', '<span class="big">' + fmtIn(desiredOffset) + '</span>'],
      ['Elbow CLR', fmtIn(radius)],
      ['Full two-90 offset', fmtIn(maximumOffset)],
      ['CUT EACH 90 TO', '<span class="big">' + elbowAngle.toFixed(3) + '°</span>'],
      ['Remove from each 90', '<span class="big">' + cutFrom90.toFixed(3) + '°</span>'],
      ['Resulting centerline advance', fmtIn(advance)],
      ['Finished takeout of each cut elbow', fmtIn(takeout)],
      ['HEEL — kept factory bevel to new cut', '<span class="big">' + fmtIn(heelMark) + '</span>'],
      ['SIDE #1 / #2', fmtIn(sideMark)],
      ['THROAT — kept factory bevel to new cut', '<span class="big">' + fmtIn(throatMark) + '</span>'],
      ['Geometry formula', 'Offset = 2R(1 − cos θ), so θ = acos(1 − offset ÷ 2R).'],
      ['Field check', 'The two new cut ends weld together. Verify actual elbow CLR, wall / bevel requirements, fit-up and project welding procedure before cutting.'],
    ]);
  } catch (error) {
    $('toolSpecialOffsetOut').innerHTML = error.message;
  }
}

function toolEqualSpreadCalc() {
  try {
    const spacing = valMeasure('toolSpreadSpacing');
    const angle = parseFloat($('toolSpreadAngle').value);
    const lines = parseInt($('toolSpreadLines').value, 10);
    const baseValue = valMeasure('toolSpreadBase');
    const base = baseValue == null ? 0 : baseValue;
    if (!(spacing > 0)) throw Error('Enter the center-to-center pipe spacing.');
    if (!(angle > 0 && angle < 180)) throw Error('Enter a turn angle above 0° and below 180°.');
    if (!(lines >= 2 && lines <= 12)) throw Error('Choose 2 through 12 parallel lines.');
    const halfAngle = angle / 2;
    const advancePerLine = spacing * Math.tan(halfAngle * Math.PI / 180);
    const rows = [
      ['Turn angle', angle.toFixed(3) + '°'],
      ['Pipe spacing', fmtIn(spacing)],
      ['Half-angle', halfAngle.toFixed(3) + '°'],
      ['TRAVEL AHEAD PER ADJACENT LINE', '<span class="big">' + fmtIn(advancePerLine) + '</span>'],
      ['Formula', 'Travel ahead = pipe spacing × tan(turn angle ÷ 2).'],
    ];
    for (let index = 0; index < lines; index++) {
      const add = advancePerLine * index;
      rows.push(['Line ' + (index + 1), baseValue == null ? 'Reference + ' + fmtIn(add) : '<b>C-F ' + fmtIn(base + add) + '</b> • add ' + fmtIn(add) + ' from Line 1']);
    }
    rows.push(['Direction note', 'These rows increase toward the side that must travel ahead. If your physical layout runs the opposite direction, subtract the same increment instead.']);
    result('toolEqualSpreadOut', rows);
  } catch (error) {
    $('toolEqualSpreadOut').innerHTML = error.message;
  }
}

function toolSaveScratch() {
  try {
    localStorage.pf_field_scratch = $('toolScratch').value;
  } catch {}
}

function toolClearScratch() {
  if (!confirm('Clear the field scratchpad?')) return;
  $('toolScratch').value = '';
  toolSaveScratch();
}
