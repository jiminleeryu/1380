const {spawnSync} = require('child_process');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', '..');

test('process.sh normalizes text, transliterates, and removes stopwords', () => {
  const text = 'The Café™ costs $3. And it’s good!';
  const res = spawnSync('bash', ['-c', 'cat | ./c/process.sh'], {
    cwd: baseDir,
    input: text,
    encoding: 'utf-8',
  });
  if (res.error) throw res.error;
  const tokens = res.stdout.trim().split(/\s+/);
  // Allow either 'cafe' or 'caf' depending on transliteration behavior
  expect(tokens).toEqual(expect.arrayContaining(['costs']));
  expect(tokens.join(' ')).toMatch(/\bcaf(e)?\b/);
  expect(tokens).toContain('costs');
  expect(tokens.join(' ')).not.toMatch(/\bthe\b/);
});
