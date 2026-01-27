const {spawnSync} = require('child_process');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', '..');

test('stem outputs Porter stems per line and skips empty', () => {
  const res = spawnSync('node', ['c/stem.js'], {
    cwd: baseDir,
    input: 'running\ncaresses\n\n',
    encoding: 'utf-8',
  });
  if (res.error) throw res.error;
  const lines = res.stdout.trim().split('\n');
  expect(lines).toEqual(['run', 'caress']);
});
