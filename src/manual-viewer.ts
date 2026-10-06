import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const pdfUrl = './resources/AudelPipefittersWeldersPocketManual.pdf';
const canvas = document.getElementById('pdfCanvas') as HTMLCanvasElement;
const pageInput = document.getElementById('page') as HTMLInputElement;
const count = document.getElementById('count') as HTMLSpanElement;
const status = document.getElementById('status') as HTMLDivElement;
const prev = document.getElementById('prev') as HTMLButtonElement;
const next = document.getElementById('next') as HTMLButtonElement;
const context = canvas.getContext('2d');

if (!context) throw new Error('Canvas is unavailable.');

let pdf: Awaited<ReturnType<typeof pdfjsLib.getDocument>['promise']>;
let pageNumber = Math.max(1, Number(new URLSearchParams(location.search).get('page')) || 1);
let renderToken = 0;

function updateUrl(page: number) {
  const url = new URL(location.href);
  url.searchParams.set('page', String(page));
  history.replaceState(null, '', url);
}

async function renderPage(requested: number) {
  if (!pdf) return;
  const token = ++renderToken;
  pageNumber = Math.max(1, Math.min(pdf.numPages, Math.round(requested)));
  pageInput.value = String(pageNumber);
  count.textContent = 'of ' + pdf.numPages;
  prev.disabled = pageNumber <= 1;
  next.disabled = pageNumber >= pdf.numPages;
  status.textContent = 'Loading page ' + pageNumber + '…';
  updateUrl(pageNumber);
  const page = await pdf.getPage(pageNumber);
  if (token !== renderToken) return;
  const base = page.getViewport({ scale: 1 });
  const available = Math.max(280, Math.min(1100, document.documentElement.clientWidth - 16));
  const scale = Math.max(0.6, Math.min(2.2, available / base.width));
  const viewport = page.getViewport({ scale });
  const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);
  canvas.style.width = Math.floor(viewport.width) + 'px';
  canvas.style.height = Math.floor(viewport.height) + 'px';
  await page.render({ canvasContext: context, viewport, transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0] }).promise;
  if (token === renderToken) status.textContent = 'Audel Pipefitter Manual • page ' + pageNumber;
}

prev.addEventListener('click', () => void renderPage(pageNumber - 1));
next.addEventListener('click', () => void renderPage(pageNumber + 1));
pageInput.addEventListener('change', () => void renderPage(Number(pageInput.value) || pageNumber));

void (async () => {
  try {
    pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    await renderPage(pageNumber);
  } catch (error) {
    status.textContent = 'Could not load the manual viewer. Use OPEN FULL MANUAL above.';
    console.error(error);
  }
})();
