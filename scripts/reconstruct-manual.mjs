import { mkdir, readFile, writeFile } from 'node:fs/promises';

const parts = Array.from({ length: 8 }, (_, i) =>
  `manual-parts/part-${String(i).padStart(2, '0')}.b64`
);
const chunks = await Promise.all(parts.map(path => readFile(path, 'utf8')));
const pdf = Buffer.from(chunks.join(''), 'base64');
if (pdf.length < 1000000 || pdf.subarray(0, 5).toString() !== '%PDF-') {
  throw new Error('Manual PDF reconstruction failed');
}
await mkdir('public/resources', { recursive: true });
await writeFile('public/resources/AudelPipefittersWeldersPocketManual.pdf', pdf);
console.log(`Restored manual PDF (${pdf.length} bytes)`);
