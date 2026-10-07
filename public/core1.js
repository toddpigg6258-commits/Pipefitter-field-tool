const $ = id => document.getElementById(id);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function den() {
  return +$('precision').value || 16;
}
function fracText(x, d = den()) {
  let w = Math.floor(x + 1e-10),
    n = Math.round((x - w) * d);
  if (n === d) {
    w++;
    n = 0;
  }
  if (!n) return '' + w;
  let g = gcd(n, d);
  return (w ? w + '-' : '') + n / g + '/' + d / g;
}
function fmtIn(x, d = den()) {
  let s = x < 0 ? '-' : '';
  x = Math.abs(x);
  return s + fracText(x, d) + '"';
}
function fmtFeet(x, d = den()) {
  let s = x < 0 ? '-' : '';
  x = Math.abs(x);
  let f = Math.floor(x / 12),
    r = x - f * 12;
  let rounded = Math.round(r * d) / d;
  if (rounded >= 12) {
    f++;
    rounded = 0;
  }
  return s + (f ? f + "' " : '') + fracText(rounded, d) + '"';
}
function mixed(s) {
  return s
    .trim()
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .reduce(
      (a, p) =>
        a + (p.includes('/') ? p.split('/').reduce((x, y) => x / y) : +p),
      0
    );
}
function literal(t) {
  let s = t.trim(),
    sign = 1;
  if (s[0] == '-') {
    sign = -1;
    s = s.slice(1).trim();
  }
  let ft = s.match(
    /^(?:(\d+(?:\.\d+)?)\s*')?\s*(?:(\d+(?:\.\d+)?(?:\s*(?:-|\s)\s*\d+\/\d+)?|\d+\/\d+)\s*(?:"|in)?)?$/i
  );
  if (ft && (ft[1] || ft[2]))
    return sign * ((ft[1] ? +ft[1] * 12 : 0) + (ft[2] ? mixed(ft[2]) : 0));
  if (/mm$/i.test(s)) return (sign * parseFloat(s)) / 25.4;
  if (/ft$/i.test(s)) return sign * parseFloat(s) * 12;
  if (/in$/i.test(s)) return sign * parseFloat(s);
  return NaN;
}
function result(el, rows) {
  $(el).innerHTML = rows
    .map(
      x =>
        '<div style="margin:4px 0"><span class="muted">' +
        x[0] +
        '</span><br><b>' +
        x[1] +
        '</b></div>'
    )
    .join('');
}
let cStore = null,
  cStoreKind = null,
  cOp = null,
  cBase = 0,
  cBuf = '',
  cTouched = false,
  cAfterEquals = false,
  cHist = 'Regular numbers + feet / inches / fractions',
  cSign = 1,
  cFracNum = null,
  cHasMeasure = false;
function cFracValue() {
  if (cFracNum === null) return null;
  let d = parseFloat(cBuf);
  if (!(d > 0)) return null;
  return cFracNum / d;
}
function cEntryKind() {
  return cHasMeasure ? 'measure' : 'number';
}
function cDisplayKind() {
  return cTouched ? cEntryKind() : cStoreKind || 'number';
}
function cFormatNumber(v) {
  if (!isFinite(v)) return 'Error';
  let a = Math.abs(v);
  if (a >= 1e9 || (a > 0 && a < 1e-7)) return v.toExponential(6);
  return String(Number(v.toFixed(8)));
}
function cFormat(v, kind) {
  return kind === 'measure' ? fmtFeet(v) : cFormatNumber(v);
}
function cEntryVal() {
  let v = cBase;
  if (cFracNum !== null) {
    let f = cFracValue();
    if (f !== null) v += f;
  } else if (cBuf) v += parseFloat(cBuf) || 0;
  return cSign * v;
}
function cDisplayVal() {
  return cTouched ? cEntryVal() : (cStore ?? 0);
}
function cPrepare() {
  if (cAfterEquals) {
    cStore = null;
    cStoreKind = null;
    cOp = null;
    cHist = '';
    cAfterEquals = false;
    cBase = 0;
    cBuf = '';
    cSign = 1;
    cTouched = false;
    cFracNum = null;
    cHasMeasure = false;
  }
}
function cKey(k) {
  cPrepare();
  if (k === '.' && cBuf.includes('.')) return;
  cBuf += k;
  cTouched = true;
  if (cFracNum !== null) cHist = 'Fraction: ' + cFracNum + ' / ' + cBuf;
  cRender();
}
function cSlash() {
  cPrepare();
  if (cFracNum !== null) {
    cHist = 'Finish the denominator first';
    cRender();
    return;
  }
  if (!cBuf) {
    cHist = 'Type the fraction top number first';
    cRender();
    return;
  }
  let n = parseFloat(cBuf);
  if (!(n >= 0)) {
    cHist = 'Check fraction';
    cRender();
    return;
  }
  cFracNum = n;
  cBuf = '';
  cTouched = true;
  cHist = 'Fraction: ' + n + ' /';
  cRender();
}
function cCommitCustomFraction() {
  if (cFracNum === null) return false;
  let d = parseFloat(cBuf);
  if (!(d > 0)) throw Error('Enter the fraction bottom number');
  cBase += cFracNum / d;
  cFracNum = null;
  cBuf = '';
  return true;
}
function cFeet() {
  cPrepare();
  if (cFracNum !== null) {
    cCommitCustomFraction();
    cHasMeasure = true;
    cHist = 'Fraction entered';
    cRender();
    return;
  }
  if (cBuf) {
    cBase += (parseFloat(cBuf) || 0) * 12;
    cBuf = '';
    cTouched = true;
    cHasMeasure = true;
    cHist = 'Feet entered';
    cRender();
  }
}
function cInch() {
  cPrepare();
  if (cFracNum !== null) {
    cCommitCustomFraction();
    cHasMeasure = true;
    cHist = 'Fraction entered';
  } else if (cBuf) {
    cBase += parseFloat(cBuf) || 0;
    cBuf = '';
    cTouched = true;
    cHasMeasure = true;
    cHist = 'Inches entered';
  }
  cRender();
}
function cCommitPending() {
  if (cFracNum !== null) cCommitCustomFraction();
  else if (cBuf) {
    cBase += parseFloat(cBuf) || 0;
    cBuf = '';
  }
}
function cFraction(n, d) {
  cPrepare();
  cCommitPending();
  cBase += n / d;
  cTouched = true;
  cHasMeasure = true;
  cHist = 'Added ' + n + '/' + d + ' inch';
  cRender();
}
function cOpenFractionPad() { const pad = document.getElementById('calcFractionPad'); if (pad) pad.classList.remove('hidden'); }
function cCloseFractionPad() { const pad = document.getElementById('calcFractionPad'); if (pad) pad.classList.add('hidden'); }
function cPickFraction(n, d) { cFraction(n, d); cCloseFractionPad(); }
function cApply(a, b, op) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') {
    if (Math.abs(b) < 1e-12) throw Error('Cannot divide by zero');
    return a / b;
  }
  return b;
}
function cResultKind(aKind, bKind, op) {
  if (op === '/')
    return aKind === 'measure' && bKind === 'number' ? 'measure' : 'number';
  if (op === '*' || op === '+' || op === '-')
    return aKind === 'measure' || bKind === 'measure' ? 'measure' : 'number';
  return bKind;
}
function opSym(op) {
  return op === '*' ? '×' : op === '/' ? '÷' : op;
}
function cResetEntry() {
  cBase = 0;
  cBuf = '';
  cTouched = false;
  cSign = 1;
  cFracNum = null;
  cHasMeasure = false;
}
function cOperator(op) {
  try {
    cAfterEquals = false;
    if (!cTouched && cStore !== null) {
      cOp = op;
      cHist = cFormat(cStore, cStoreKind || 'number') + ' ' + opSym(op);
      cRender();
      return;
    }
    let v = cEntryVal(),
      kind = cEntryKind();
    if (cStore === null) {
      cStore = v;
      cStoreKind = kind;
    } else if (cOp) {
      cStore = cApply(cStore, v, cOp);
      cStoreKind = cResultKind(cStoreKind || 'number', kind, cOp);
    }
    cOp = op;
    cHist = cFormat(cStore, cStoreKind || 'number') + ' ' + opSym(op);
    cResetEntry();
    cRender();
  } catch (e) {
    cHist = e.message;
    cRender();
  }
}
function cEquals() {
  try {
    if (cStore === null || !cOp) {
      let kind = cEntryKind();
      cCommitPending();
      cStore = cEntryVal();
      cStoreKind = kind;
      cResetEntry();
      cAfterEquals = true;
      cRender();
      return;
    }
    let b = cEntryVal(),
      bKind = cEntryKind(),
      a = cStore,
      aKind = cStoreKind || 'number',
      r = cApply(a, b, cOp),
      rKind = cResultKind(aKind, bKind, cOp);
    cHist = cFormat(a, aKind) + ' ' + opSym(cOp) + ' ' + cFormat(b, bKind) + ' =';
    cStore = r;
    cStoreKind = rKind;
    cOp = null;
    cResetEntry();
    cAfterEquals = true;
    cRender();
  } catch (e) {
    cHist = e.message;
    cRender();
  }
}
function cBack() {
  if (cBuf) cBuf = cBuf.slice(0, -1);
  else if (cFracNum !== null) {
    cBuf = String(cFracNum);
    cFracNum = null;
    cHist = '';
  }
  cRender();
}
function cToggleSign() {
  if (cTouched) cSign *= -1;
  else if (cStore !== null) cStore *= -1;
  cRender();
}
function cClear() {
  cStore = null;
  cStoreKind = null;
  cOp = null;
  cBase = 0;
  cBuf = '';
  cTouched = false;
  cAfterEquals = false;
  cHist = 'Regular numbers + feet / inches / fractions';
  cSign = 1;
  cFracNum = null;
  cHasMeasure = false;
  cRender();
}
function cRender() {
  let v = cDisplayVal(),
    kind = cDisplayKind(),
    liveNumber =
      kind === 'number' &&
      cTouched &&
      !cHasMeasure &&
      cFracNum === null &&
      cBase === 0 &&
      cBuf
        ? (cSign < 0 ? '-' : '') + cBuf
        : null;
  $('calcHistory').textContent = cHist || ' ';
  $('calcMain').textContent = liveNumber || cFormat(v, kind);
  if (kind === 'measure') {
    $('calcSub').textContent =
      (v / 12).toFixed(5) + ' ft • ' + v.toFixed(4) + ' in';
    result('conv', [
      ['Decimal inches', v.toFixed(4) + ' in'],
      ['Decimal feet', (v / 12).toFixed(5) + ' ft'],
      ['Millimeters', (v * 25.4).toFixed(2) + ' mm'],
    ]);
  } else {
    $('calcSub').textContent = 'Regular number • no units';
    result('conv', [
      ['Regular number', cFormatNumber(v)],
      ['Tip', 'Press FEET or INCH when the number is a measurement.'],
    ]);
  }
}
