import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defaultSiteOrigin, validateSiteOrigin } from './project-config.mjs';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--origin')) {
  throw new Error('Usage: pnpm setup [--origin https://your-site.example]');
}
const root = new URL('../', import.meta.url);
const siteOrigin = validateSiteOrigin(args[1] ?? defaultSiteOrigin);
mkdirSync(new URL('.mytask/', root), { recursive: true });
writeFileSync(new URL('.mytask/config.json', root), JSON.stringify({ siteOrigin }, null, 2) + '\n');
const hosting = new URL('.openai/hosting.json', root);
if (!existsSync(hosting)) {
  mkdirSync(new URL('.openai/', root), { recursive: true });
  writeFileSync(hosting, readFileSync(new URL('.openai/hosting.example.json', root)));
}
const destination = new URL('dist/companion/', root);
mkdirSync(destination, { recursive: true });
for (const name of ['background.js', 'chat.js', 'site.js', 'README.md']) {
  writeFileSync(new URL(name, destination), readFileSync(new URL('companion/' + name, root)));
}
const shared = readFileSync(new URL('companion/shared.js', root), 'utf8');
writeFileSync(new URL('shared.js', destination), shared.replace(
  /^export const SITE_ORIGIN=.*;$/m, 'export const SITE_ORIGIN=' + JSON.stringify(siteOrigin) + ';',
));
const manifest = JSON.parse(readFileSync(new URL('companion/manifest.json', root), 'utf8'));
manifest.host_permissions = ['https://chatgpt.com/*', siteOrigin + '/*'];
manifest.content_scripts[0].matches = [siteOrigin + '/launch*'];
writeFileSync(new URL('manifest.json', destination), JSON.stringify(manifest, null, 2) + '\n');
for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) {
  writeFileSync(new URL(name, destination), readFileSync(new URL(name, root)));
}
console.log('Configured site:', siteOrigin);
console.log('Load browser extension from:', fileURLToPath(destination));
