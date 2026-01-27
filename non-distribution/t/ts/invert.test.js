const {spawnSync} = require('child_process');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', '..');

test('invert.sh aggregates frequencies and formats lines', () => {
  const res = spawnSync('bash', ['-c', 'cat | ./c/invert.sh http://example.com/page'], {
    cwd: baseDir,
    input: 'a\nb\nb\n',
    encoding: 'utf-8',
  });
  if (res.error) throw res.error;
  const lines = res.stdout.trim().split('\n').map((l)=>l.replace(/\s+/g, ' ').trim()).sort();
  expect(lines).toContain('a | 1 | http://example.com/page');
  expect(lines).toContain('b | 2 | http://example.com/page');
});
