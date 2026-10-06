function saddleSyncTypeCards() {
  const type = $('sadType')?.value || 'CENTERED_90';
  document.querySelectorAll('[data-saddle-type]').forEach(card => {
    card.classList.toggle('active', card.dataset.saddleType === type);
  });
}

function selectSaddleType(type) {
  const select = $('sadType');
  if (!select) return;
  select.value = type;
  saddleTypeChanged();
}

function saddleIsElbowBack(type) {
  return type === 'ELBOW_BACK_90' || type === 'ELBOW_BACK_ANY';
}

function saddleElbowTypeChanged(recalc = true) {
  const type = $('sadType')?.value || 'CENTERED_90';
  const elbowType = $('sadElbowType')?.value || 'LR90';
  const customWrap = $('sadElbowClrWrap');
  if (customWrap) {
    customWrap.classList.toggle(
      'hidden',
      !saddleIsElbowBack(type) || elbowType !== 'CUSTOM'
    );
  }
  if (recalc && saddleIsElbowBack(type)) saddleCalc();
}

function saddleTypeChanged() {
  const type = $('sadType')?.value || 'CENTERED_90';
  const angleInput = $('sang');
  const elbowWrap = $('sadElbowWrap');

  if (angleInput) {
    if (type === 'CENTERED_90' || type === 'ELBOW_BACK_90') {
      angleInput.value = '90';
      angleInput.disabled = true;
    } else if (type === 'ECCENTRIC_45') {
      angleInput.value = '90';
      angleInput.disabled = true;
    } else {
      angleInput.disabled = false;
    }
  }

  if (elbowWrap) {
    elbowWrap.classList.toggle('hidden', !saddleIsElbowBack(type));
  }

  saddleElbowTypeChanged(false);
  saddleSyncTypeCards();
  saddleCalc();
}

function saddleOrdinateLabel(index, divisions) {
  return Math.min(index, divisions - index);
}

function saddleSequenceText(divisions) {
  return Array.from(
    { length: divisions },
    (_, index) => saddleOrdinateLabel(index, divisions)
  ).join(' ');
}

function saddleTypeLabel(type) {
  return ({
    CENTERED_90: '90° Centered Saddle',
    CENTERED_ANY: 'Intersection at Any Degree',
    ECCENTRIC_45: '90° Eccentric Pipe Riser',
    ECCENTRIC_TANGENT: 'Eccentric Intersection at Any Degree',
    ELBOW_BACK_90: 'Concentric Riser on Back of Elbow',
    ELBOW_BACK_ANY: 'Angled Riser on Back of Elbow',
  })[type] || type;
}

function saddleElbowClr(runSize) {
  const elbowType = $('sadElbowType')?.value || 'LR90';
  if (elbowType === 'CUSTOM') {
    const text = $('sadElbowClr')?.value?.trim() || '';
    return {
      elbowType,
      label: 'Custom 90° elbow',
      clr: text ? literal(text) : NaN,
    };
  }

  return {
    elbowType,
    label:
      elbowType === 'SR90'
        ? '90° short-radius BW elbow'
        : '90° long-radius BW elbow',
    clr: BW[elbowType]?.inch?.[runSize],
  };
}

function saddleRenderTopView(divisions, type, angleDeg) {
  const target = $('saddleTopView');
  if (!target) return;
  const cx = 170;
  const cy = 150;
  const radius = 96;
  const ticks = [];

  for (let index = 0; index < divisions; index++) {
    const phi = Math.PI - 2 * Math.PI * index / divisions;
    const x1 = cx + Math.cos(phi) * 14;
    const y1 = cy + Math.sin(phi) * 14;
    const x2 = cx + Math.cos(phi) * radius;
    const y2 = cy + Math.sin(phi) * radius;
    const tx = cx + Math.cos(phi) * (radius + 18);
    const ty = cy + Math.sin(phi) * (radius + 18) + 4;
    const label = saddleOrdinateLabel(index, divisions);
    ticks.push(
      '<line x1="' +
        x1.toFixed(1) +
        '" y1="' +
        y1.toFixed(1) +
        '" x2="' +
        x2.toFixed(1) +
        '" y2="' +
        y2.toFixed(1) +
        '" class="sad-top-line"></line>'
    );
    ticks.push(
      '<text x="' +
        tx.toFixed(1) +
        '" y="' +
        ty.toFixed(1) +
        '" text-anchor="middle" class="sad-top-number">' +
        label +
        '</text>'
    );
  }

  const sequence = saddleSequenceText(divisions);
  const title = saddleTypeLabel(type);
  const elbowBack = saddleIsElbowBack(type);
  const reference =
    angleDeg === 90
      ? elbowBack
        ? 'square wrap line at the longest elbow-back intercept'
        : 'square wrap line'
      : (90 - angleDeg).toFixed(1) + '° complement miter line';
  const targetText = elbowBack
    ? 'Target surface: outside / back of the 90° elbow'
    : 'Target surface: straight run pipe';

  target.innerHTML =
    '<div class="saddle-top-title"><b>TOP / END VIEW — ORDINATE LINES</b><span>' +
    title +
    '</span></div>' +
    '<svg viewBox="0 0 340 300" role="img" aria-label="Top of branch pipe with mirrored ordinate line numbering">' +
    '<circle cx="170" cy="150" r="96" class="sad-top-circle"></circle>' +
    ticks.join('') +
    '<circle cx="170" cy="150" r="5" class="sad-top-center"></circle>' +
    '<text x="170" y="143" text-anchor="middle" class="sad-top-center-label">BRANCH</text>' +
    '<text x="170" y="164" text-anchor="middle" class="sad-top-center-label">TOP VIEW</text>' +
    '</svg>' +
    '<div class="note-box"><b>Number sequence:</b> ' +
    sequence +
    '<br><b>Measure from:</b> ' +
    reference +
    '<br><b>' +
    targetText +
    '</b><br>The closing point returns to the original 0 line, so a second 0 is not printed.</div>';
}

function saddleBuildStraightPoints(
  runRadius,
  branchRadius,
  eccentricity,
  divisions,
  circumference,
  csc,
  allowance
) {
  const minimumProjectedDistance =
    eccentricity <= branchRadius ? 0 : eccentricity - branchRadius;
  const zMax = Math.sqrt(
    Math.max(
      0,
      runRadius * runRadius -
        minimumProjectedDistance * minimumProjectedDistance
    )
  );
  const raw = [];

  for (let index = 0; index < divisions; index++) {
    const theta = 2 * Math.PI * index / divisions;
    const lateral = eccentricity + branchRadius * Math.cos(theta);
    const inside = runRadius * runRadius - lateral * lateral;
    if (inside < -1e-8) {
      throw Error(
        'This eccentricity does not intersect the run at every ordinate line.'
      );
    }
    const z = Math.sqrt(Math.max(0, inside));
    const base90 = zMax - z;
    const ordinate = base90 * csc + allowance;
    raw.push({
      index,
      ordinateLabel: saddleOrdinateLabel(index, divisions),
      degrees: 360 * index / divisions,
      wrap: circumference * index / divisions,
      base90,
      cut: ordinate,
    });
  }

  return raw;
}

function saddleBuildElbowBackPoints(
  elbowClr,
  runRadius,
  branchRadius,
  divisions,
  circumference,
  csc,
  allowance
) {
  const hits = [];

  for (let index = 0; index < divisions; index++) {
    const theta = 2 * Math.PI * index / divisions;
    const tangentOffset = branchRadius * Math.cos(theta);
    const outOfPlaneOffset = branchRadius * Math.sin(theta);
    const shellSquared =
      runRadius * runRadius - outOfPlaneOffset * outOfPlaneOffset;

    if (shellSquared < -1e-8) {
      throw Error(
        'The branch is too large for a full back-of-elbow saddle at every ordinate line.'
      );
    }

    const shellRise = Math.sqrt(Math.max(0, shellSquared));
    const outerShellRadius = elbowClr + shellRise;
    const axisSquared =
      outerShellRadius * outerShellRadius -
      tangentOffset * tangentOffset;

    if (axisSquared < -1e-8) {
      throw Error(
        'This branch / elbow CLR combination does not produce a full elbow-back intersection.'
      );
    }

    const elbowHit =
      Math.sqrt(Math.max(0, axisSquared)) - elbowClr;

    hits.push({
      index,
      ordinateLabel: saddleOrdinateLabel(index, divisions),
      degrees: 360 * index / divisions,
      wrap: circumference * index / divisions,
      elbowHit,
    });
  }

  const longestHit = Math.max(...hits.map(point => point.elbowHit));

  return hits.map(point => {
    const base90 = longestHit - point.elbowHit;
    return {
      ...point,
      base90,
      cut: base90 * csc + allowance,
    };
  });
}

function saddleBuildAndShowMarks() {
  saddleCalc();
  const marksButton = document.querySelector('[data-subtab-button-group="saddle"][data-subtab-button-panel="marks"]');
  if (typeof selectSectionTab === 'function') selectSectionTab('saddle', 'marks', marksButton);
}

function saddleCalc() {
  try {
    const runSize = $('run').value;
    const branchSize = $('branch').value;
    const runRadius = OD[runSize] / 2;
    const branchRadius = OD[branchSize] / 2;
    const type = $('sadType')?.value || 'CENTERED_90';
    const elbowBack = saddleIsElbowBack(type);
    const angleDeg = parseFloat($('sang').value);
    const angle = angleDeg * Math.PI / 180;
    const divisions = parseInt($('divs').value, 10);
    const allowText = $('gap').value.trim();
    const allowance = allowText ? literal(allowText) : 0;

    if (!isFinite(allowance) || allowance < 0) {
      throw Error('Check cutback allowance.');
    }
    if (!(runRadius > 0) || !(branchRadius > 0)) {
      throw Error('Choose valid run and branch pipe sizes.');
    }
    if (branchRadius > runRadius) {
      throw Error('Branch OD is larger than the run / elbow OD.');
    }
    if (!(angleDeg > 0 && angleDeg <= 90)) {
      throw Error('Branch angle must be above 0° and no more than 90°.');
    }
    if (![8, 16].includes(divisions)) {
      throw Error('Use 8 or 16 ordinate divisions.');
    }

    let eccentricity = 0;
    if (!elbowBack) {
      if (
        type === 'ECCENTRIC_45' ||
        type === 'ECCENTRIC_TANGENT'
      ) {
        eccentricity = Math.max(0, runRadius - branchRadius);
      }
      if (!isFinite(eccentricity) || eccentricity < 0) {
        throw Error('Check the eccentric centerline offset.');
      }
      if (eccentricity + branchRadius > runRadius + 1e-9) {
        throw Error(
          'For this saddle geometry, center offset + branch radius must not exceed the run radius.'
        );
      }
    }

    let elbowInfo = null;
    if (elbowBack) {
      elbowInfo = saddleElbowClr(runSize);
      if (!(elbowInfo.clr > 0)) {
        throw Error(
          elbowInfo.elbowType === 'CUSTOM'
            ? 'Enter the actual 90° elbow centerline radius (CLR).'
            : 'No loaded 90° elbow CLR is available for this run size / elbow type. Choose another elbow type or Custom CLR.'
        );
      }
      if (elbowInfo.clr <= runRadius) {
        throw Error(
          'The 90° elbow CLR must be greater than the elbow pipe radius.'
        );
      }
    }

    saddleSyncTypeCards();
    saddleRenderTopView(divisions, type, angleDeg);

    const circumference = 2 * Math.PI * branchRadius;
    const spacing = circumference / divisions;
    const sinAngle = Math.sin(angle);
    if (!(sinAngle > 0)) {
      throw Error('Branch angle produces an invalid cosecant.');
    }
    const csc = 1 / sinAngle;

    const raw = elbowBack
      ? saddleBuildElbowBackPoints(
          elbowInfo.clr,
          runRadius,
          branchRadius,
          divisions,
          circumference,
          csc,
          allowance
        )
      : saddleBuildStraightPoints(
          runRadius,
          branchRadius,
          eccentricity,
          divisions,
          circumference,
          csc,
          allowance
        );

    const maxCut = Math.max(...raw.map(point => point.cut));
    const sequence = saddleSequenceText(divisions);
    const complement = 90 - angleDeg;
    const referenceLabel =
      angleDeg === 90
        ? elbowBack
          ? 'SQUARE WRAP LINE • LONGEST BACK-OF-ELBOW INTERCEPT'
          : 'WRAPAROUND / SQUARE REFERENCE LINE'
        : `MITER LINE • ${complement.toFixed(3)}° complement`;
    const markHeader = $('sadMarkHeader');
    if (markHeader) {
      markHeader.textContent =
        angleDeg === 90
          ? 'MEASURE BACK FROM WRAP LINE'
          : 'MEASURE FROM MITER LINE';
    }

    const rows = [
      ['Saddle type', saddleTypeLabel(type)],
      ['Branch circumference', fmtIn(circumference)],
      ['Ordinate spacing around branch', fmtIn(spacing)],
      ['Ordinate numbering', '<b>' + sequence + '</b>'],
      ['Reference line', referenceLabel],
      ['Cosecant multiplier', csc.toFixed(5)],
      [
        'Largest ordinate',
        '<span class="big">' + fmtIn(maxCut) + '</span>',
      ],
    ];

    if (elbowBack) {
      rows.splice(
        1,
        0,
        ['90° elbow / header size', runSize + '&quot; NPS'],
        ['90° elbow geometry', elbowInfo.label],
        ['90° elbow CLR used', '<b>' + fmtIn(elbowInfo.clr) + '</b>']
      );
      rows.push([
        'Elbow-back formula',
        'q = √(R² − (r sinθ)²); u = √((CLR + q)² − (r cosθ)²) − CLR; 90° ordinate = umax − u; final ordinate = 90° ordinate × csc(branch angle) + allowance',
      ]);
      rows.push([
        'Geometry used',
        'Branch centerline comes radially off the outside / back of the 90° elbow. Run NPS is the elbow/header size.',
      ]);
    } else {
      rows.push([
        'Formula',
        '90° base ordinate = zmax − √(R² − (e + r cosθ)²); final ordinate = base × csc(branch angle) + allowance',
      ]);
    }

    result('sadSummary', rows);

    if (elbowBack) {
      $('orientNote').innerHTML =
        angleDeg === 90
          ? '<b>Back of 90° elbow:</b> this pattern treats the branch as coming radially off the outside / back of the bend. The app uses the selected elbow CLR, marks the branch <b>' +
            sequence +
            '</b>, and measures every ordinate back from the longest-intercept square wrap line.'
          : '<b>Angled branch off the back of a 90° elbow:</b> the app first calculates the 90° torus / elbow-back ordinates using the selected CLR, then multiplies them by <b>cosecant(' +
            angleDeg.toFixed(3) +
            '°)</b>. Lay out the branch miter line at the complement, <b>' +
            complement.toFixed(3) +
            '°</b>, and measure the numbered ordinates from that line.';
    } else {
      $('orientNote').innerHTML =
        angleDeg === 90
          ? '<b>90° saddle:</b> use a square wraparound reference line. Mark the branch ' +
            sequence +
            ' and measure each listed ordinate back from that line.'
          : '<b>Angled saddle:</b> first lay out the miter line at the complement, <b>' +
            complement.toFixed(3) +
            '°</b>. Then mark the branch <b>' +
            sequence +
            '</b> and measure each ordinate from the miter line. This follows the 90° ordinate × cosecant(angle) layout method.';
    }

    const quarter = divisions / 4;
    $('sadBody').innerHTML = raw
      .map(
        point =>
          '<tr class="' +
          (point.index % quarter === 0 ? 'quarter' : '') +
          '">' +
          '<td><b>' +
          point.index +
          '</b></td>' +
          '<td><b>' +
          point.ordinateLabel +
          '</b></td>' +
          '<td>' +
          point.degrees.toFixed(1).replace('.0', '') +
          '°</td>' +
          '<td>' +
          fmtIn(point.wrap) +
          '</td>' +
          '<td><span class="big">' +
          fmtIn(point.cut) +
          '</span></td>' +
          '</tr>'
      )
      .join('');

    const width = 760;
    const height = 285;
    const padLeft = 42;
    const padRight = 24;
    const top = 50;
    const bottom = 52;
    const drawHeight = height - top - bottom;
    const scale = Math.max(maxCut, 0.01);
    const plotRaw = raw.concat([{ ...raw[0], wrap: circumference }]);
    const coords = plotRaw
      .map(point => {
        const x =
          padLeft +
          point.wrap / circumference * (width - padLeft - padRight);
        const y = top + point.cut / scale * drawHeight;
        return x + ',' + y;
      })
      .join(' ');
    const labels = raw
      .map(point => {
        const x =
          padLeft +
          point.wrap / circumference * (width - padLeft - padRight);
        return (
          '<text x="' +
          x.toFixed(1) +
          '" y="268" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="800">' +
          point.ordinateLabel +
          '</text>'
        );
      })
      .join('');

    $('chart').innerHTML =
      '<svg viewBox="0 0 ' +
      width +
      ' ' +
      height +
      '" class="profile" aria-label="Saddle ordinate profile">' +
      '<text x="42" y="20" fill="#cbd5e1">' +
      referenceLabel +
      '</text>' +
      '<text x="42" y="38" fill="#94a3b8">Ordinate numbers follow the wrap: ' +
      sequence +
      '</text>' +
      '<line x1="42" y1="50" x2="736" y2="50" stroke="#94a3b8"/>' +
      '<polyline points="' +
      coords +
      '" fill="none" stroke="#fbbf24" stroke-width="4"/>' +
      labels +
      '</svg>';
  } catch (error) {
    $('sadSummary').textContent = error.message;
    if ($('sadBody')) $('sadBody').innerHTML = '';
    if ($('chart')) $('chart').innerHTML = '';
  }
}
