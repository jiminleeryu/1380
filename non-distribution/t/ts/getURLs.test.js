const {spawnSync} = require('child_process');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', '..');

function runGetURLs(base, html) {
  const res = spawnSync('node', ['c/getURLs.js', base], {
    cwd: baseDir,
    input: html,
    encoding: 'utf-8',
  });
  if (res.error) throw res.error;
  return res.stdout.trim().split('\n').filter(Boolean);
}

test('getURLs resolves relative and absolute URLs; drops invalid', () => {
  const out = runGetURLs(
      'http://example.com/index.html',
      '<a href="/about">About</a> <a href="http://other.com/page">Ext</a> <a href="invalid:###">Bad</a>',
  );
  expect(out).toContain('http://example.com/about');
  expect(out).toContain('http://other.com/page');
});

test('getURLs handles base without trailing slash', () => {
  const out = runGetURLs(
      'http://mysite.com/docs',
      '<a href="guide">Guide</a>',
  );
  expect(out).toContain('http://mysite.com/docs/guide');
});
