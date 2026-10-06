orderedPipeSizes(Object.keys(OD)).forEach(k => {
  $('run').add(new Option(k, k));
  $('branch').add(new Option(k, k));
  $('odList').innerHTML +=
    '<span class="pill"><b>' +
    k +
    '&quot;</b> OD ' +
    fmtIn(OD[k], 16) +
    '</span>';
});
$('run').value = '6';
$('branch').value = '4';
[22.5, 30, 45, 60].forEach(
  a =>
    ($('trig').innerHTML +=
      '<tr><td>' +
      a +
      '°</td><td>' +
      (1 / Math.sin((a * Math.PI) / 180)).toFixed(4) +
      '</td><td>' +
      (1 / Math.tan((a * Math.PI) / 180)).toFixed(4) +
      '</td></tr>')
);
fillBwSizes();
$('bwsize').value = '4';
bwTypeChanged();
initSocketWeld();
initThreadedFittings();
initGroovedFittings();
initTorqueSizes();
renderBoltPattern();
isoLoadMeta();
isoAddLeg();
bindMeasureInputs();
const triSolver = [...document.querySelectorAll('#calc .card')].find(card => card.querySelector('h3')?.textContent.trim() === 'Rise / Run / Travel / Angle');
const layoutPage = $('layout');
if (triSolver && layoutPage) {
  const layoutIntro = layoutPage.querySelector('.card.good');
  if (layoutIntro) layoutIntro.after(triSolver);
  else layoutPage.appendChild(triSolver);
}
initFieldTools();
cRender();
refreshAll();
renderTakes();
$('triOut').innerHTML = 'Enter any two values.';
