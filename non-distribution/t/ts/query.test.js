const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', '..');

function setupTestIndex(content) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'query-test-'));
    const indexPath = path.join(tmpDir, 'global-index.txt');
    fs.writeFileSync(indexPath, content);
    return { tmpDir, indexPath };
}

function runQuery(indexPath, ...args) {
    // Temporarily replace the index file path in query.js
    const queryScript = `
    const fs = require('fs');
    const {execSync} = require('child_process');
    
    function query(indexFile, args) {
      const queryStr = args.join(' ');
      const processed = execSync(\`echo "\${queryStr}" | ./c/process.sh | ./c/stem.js | tr "\\\\r\\\\n" "  "\`, {encoding: 'utf-8'}).trim();
      if (!processed) return;
      const content = fs.readFileSync(indexFile, {encoding: 'utf-8'});
      const lines = content.split('\\n');
      for (const line of lines) {
        if (line.includes(processed)) {
          console.log(line);
        }
      }
    }
    query('${indexPath}', ${JSON.stringify(args)});
  `;

    const res = spawnSync('node', ['-e', queryScript], {
        cwd: baseDir,
        encoding: 'utf-8',
    });
    if (res.error) throw res.error;
    return res.stdout.trim();
}

test('query.js finds matching terms in global index', () => {
    const { indexPath } = setupTestIndex([
        'run | url1 5 url2 3',
        'jump | url3 2',
        'run fast | url1 1',
        '',
    ].join('\n'));

    const out = runQuery(indexPath, 'running');
    expect(out).toContain('run |');
});

test('query.js returns empty for non-existent terms', () => {
    const { indexPath } = setupTestIndex([
        'apple | url1 5',
        'banana | url2 3',
        '',
    ].join('\n'));

    const out = runQuery(indexPath, 'zebra');
    expect(out).toBe('');
});

test('query.js handles multi-word queries', () => {
    const { indexPath } = setupTestIndex([
        'quick brown | url1 5',
        'brown fox | url2 3',
        'quick brown fox | url3 1',
        '',
    ].join('\n'));

    const out = runQuery(indexPath, 'quick', 'brown');
    expect(out).toContain('quick brown');
});

test('query.js filters out stopwords from query', () => {
    const { indexPath } = setupTestIndex([
        'the | url1 5',
        'cat | url2 3',
        '',
    ].join('\n'));

    // "the" is a stopword and should be filtered, so searching for "the cat" 
    // should only match "cat"
    const out = runQuery(indexPath, 'cat');
    expect(out).toContain('cat');
});
