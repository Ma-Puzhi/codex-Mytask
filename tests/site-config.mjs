import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateSiteOrigin } from '../scripts/project-config.mjs';

assert.equal(validateSiteOrigin('https://tasks.example/'), 'https://tasks.example');
assert.equal(validateSiteOrigin('http://localhost:5173'), 'http://localhost:5173');
for (const origin of ['http://tasks.example', 'https://user:password@tasks.example', 'https://tasks.example/path', 'https://tasks.example/?token=value', 'javascript:alert(1)']) {
  assert.throws(() => validateSiteOrigin(origin));
}
const temporary = mkdtempSync(path.join(tmpdir(), 'mytask-config-test-'));
try {
  for (const name of ['scripts', 'companion', 'LICENSE', 'THIRD_PARTY_NOTICES.md']) {
    cpSync(new URL('../' + name, import.meta.url), path.join(temporary, name), { recursive: true });
  }
  mkdirSync(path.join(temporary, '.openai'));
  cpSync(new URL('../.openai/hosting.example.json', import.meta.url), path.join(temporary, '.openai/hosting.example.json'));
  const hosting = path.join(temporary, '.openai/hosting.json');
  writeFileSync(hosting, '{"d1":"DB","project_id":"existing-project"}\n');
  const result = spawnSync(process.execPath, ['scripts/configure-site.mjs', '--origin', 'https://tasks.example'], { cwd: temporary, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(hosting)).project_id, 'existing-project');
  const manifest = JSON.parse(readFileSync(path.join(temporary, 'dist/companion/manifest.json')));
  assert.deepEqual(manifest.host_permissions, ['https://chatgpt.com/*', 'https://tasks.example/*']);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://tasks.example/launch*']);
  assert.match(readFileSync(path.join(temporary, 'dist/companion/shared.js'), 'utf8'), /SITE_ORIGIN="https:\/\/tasks\.example"/);
  assert.equal(JSON.parse(readFileSync(path.join(temporary, '.mytask/config.json'))).siteOrigin, 'https://tasks.example');
  assert.ok(readFileSync(path.join(temporary, 'dist/companion/LICENSE'), 'utf8').includes('MIT License'));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
console.log('PASS: custom origins, narrow extension permissions, deployment identity preservation and license packaging.');
