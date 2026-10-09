import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Prepare local assets for native DEVELOPMENT. This does not produce a signed
// binary, add billing, attest content rights, or submit anything to either store.
const mobile = fileURLToPath(new URL('../', import.meta.url));
const dist = path.resolve(mobile, '../dist');
const target = path.join(mobile, 'www');
const config = JSON.parse(await readFile(path.join(mobile, 'capacitor.config.json'), 'utf8'));
if (!config.appId || config.appId.startsWith('com.example.') || !/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*){2,}$/.test(config.appId)) {
  throw new Error('Set the confirmed owner bundle/application ID in mobile/capacitor.config.json first.');
}
if (config.webDir !== 'www' || config.server?.url) {
  throw new Error('Native development must use the local www bundle, not the live test website.');
}
await access(path.join(dist, 'app.html'));
// Refuse a stale bundle instead of accidentally retaining removed assets.
try {
  await access(target);
  throw new Error('mobile/www already exists. Archive or remove the old generated bundle before preparing a new one.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await mkdir(target, { recursive: true });
await cp(dist, target, { recursive: true });
const html = await readFile(path.join(dist, 'app.html'), 'utf8');
if (!/<head[\s>]/i.test(html)) throw new Error('App entry must contain a head element for Capacitor.');
// Use the real app at the root so Capacitor can inject its native bridge there.
await writeFile(path.join(target, 'index.html'), html);
console.log('Native development web bundle prepared. Billing, content clearance, native projects, signing and store review are still required.');
