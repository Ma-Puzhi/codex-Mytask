import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const name of ['task-launch', 'companion-background', 'companion-chat', 'launcher-close', 'mytasks-v21.test', 'site-config']) {
  console.log('\nRunning', name);
  const result = spawnSync(process.execPath, ['tests/' + name + '.mjs'], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
