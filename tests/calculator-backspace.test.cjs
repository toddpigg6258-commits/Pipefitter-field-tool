const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function calculator() {
  const elements = new Map();
  const context = vm.createContext({ document: { getElementById(id) {
    if (!elements.has(id)) elements.set(id, { value: '16', textContent: '', innerHTML: '' });
    return elements.get(id);
  } } });
  vm.runInContext(fs.readFileSync('public/core1.js', 'utf8'), context);
  return code => vm.runInContext(code, context);
}
test('backspace removes a shortcut fraction while retaining feet and inches', () => {
  const run = calculator();
  run("cKey('4'); cFeet(); cKey('5'); cInch(); cFraction(1,8)");
  assert.equal(run('cEntryVal()'), 53.125);
  run('cBack()');
  assert.equal(run('cEntryVal()'), 53);
  assert.equal(run('cDisplayKind()'), 'measure');
  run('cBack(); cBack()');
  assert.equal(run('cEntryVal()'), 48);
});
test('multiple fractions and modal picks undo one at a time', () => {
  const run = calculator();
  run('cFraction(1,8); cFraction(3,16); cBack()');
  assert.equal(run('cEntryVal()'), 0.125);
  run('cBack()');
  assert.equal(run('cDisplayVal()'), 0);
});
test('custom numerator and denominator remain editable after committing', () => {
  const run = calculator();
  run("cKey('3'); cSlash(); cKey('1'); cKey('6'); cInch(); cBack()");
  assert.equal(run('cFracNum'), 3);
  assert.equal(run('cBuf'), '16');
  run('cBack()');
  assert.equal(run('cBuf'), '1');
  run('cBack(); cBack()');
  assert.equal(run('cFracNum'), null);
  assert.equal(run('cBuf'), '3');
});
test('clear and a new operand discard previous entry history', () => {
  const run = calculator();
  run('cFraction(1,2); cClear(); cBack()');
  assert.equal(run('cDisplayVal()'), 0);
  run("cKey('4'); cFeet(); cOperator('+'); cFraction(1,8); cBack()");
  assert.equal(run('cStore'), 48);
  assert.equal(run('cEntryVal()'), 0);
  run("cKey('2'); cInch(); cEquals()");
  assert.equal(run('cDisplayVal()'), 50);
  run('cFraction(1,4); cBack()');
  assert.equal(run('cDisplayVal()'), 0);
});
test('decimal digits and sign still work with backspace', () => {
  const run = calculator();
  run("cKey('1'); cKey('.'); cKey('5'); cToggleSign(); cBack()");
  assert.equal(run('cEntryVal()'), -1);
  run("cKey('2')");
  assert.equal(run('cEntryVal()'), -1.2);
});
