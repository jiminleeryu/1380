const {spawnSync} = require('child_process');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', '..');

function runGetText(html) {
  const res = spawnSync('node', ['c/getText.js'], {
    cwd: baseDir,
    input: html,
    encoding: 'utf-8',
  });
  if (res.error) throw res.error;
  return res.stdout.trim();
}

test('getText extracts text and hides link href', () => {
  const out = runGetText('<div>Hello <a href="/x">World</a>!</div>');
  expect(out).toContain('Hello');
  expect(out).toContain('World');
  expect(out).toContain('!');
  expect(out).not.toMatch(/\s\/x\b/);
});

test('getText yields empty on empty input', () => {
  const out = runGetText('');
  expect(out).toBe('');
});
