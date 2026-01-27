const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');

const baseDir = path.resolve(__dirname, '..', '..');

test('merge.js merges local into global, sums and sorts by freq', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-test-'));
  const globalPath = path.join(tmpDir, 'global.txt');
  fs.writeFileSync(globalPath, [
    'word1 word2 | url4 2',
    'word3 | url3 2',
    '',
  ].join('\n'));

  const local = [
    'word1 word2 | 8 | url1',
    'word3 | 1 | url9',
    '',
  ].join('\n');

  const res = spawnSync('node', ['c/merge.js', globalPath], {
    cwd: baseDir,
    input: local,
    encoding: 'utf-8',
  });
  if (res.error) throw res.error;
  const out = res.stdout.trim().split('\n');
  expect(out).toContain('word1 word2 | url1 8 url4 2');
  expect(out).toContain('word3 | url3 2 url9 1');
});
