const {spawnSync} = require('child_process');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', '..');

test('combine.sh yields 1-grams, 2-grams, and 3-grams', () => {
  const res = spawnSync('bash', ['-c', 'cat | ./c/combine.sh'], {
    cwd: baseDir,
    input: 'a\nb\nc\n',
    encoding: 'utf-8',
  });
  if (res.error) throw res.error;
  const lines = res.stdout.trim().split('\n').map((l)=>l.replace(/\s+/g, ' ').trim());
  expect(lines).toEqual(expect.arrayContaining(['a', 'b', 'c', 'a b', 'b c', 'a b c']));
});
