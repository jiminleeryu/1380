#!/usr/bin/env node

/*
Merge the current inverted index (assuming the right structure) with the global index file
Usage: input > ./merge.js global-index > output

The inverted indices have the different structures!

Each line of a local index is formatted as:
  - `<word/ngram> | <frequency> | <url>`

Each line of a global index is be formatted as:
  - `<word/ngram> | <url_1> <frequency_1> <url_2> <frequency_2> ... <url_n> <frequency_n>`
  - Where pairs of `url` and `frequency` are in descending order of frequency
  - Everything after `|` is space-separated

-------------------------------------------------------------------------------------
Example:

local index:
  word1 word2 | 8 | url1
  word3 | 1 | url9
EXISTING global index:
  word1 word2 | url4 2
  word3 | url3 2

merge into the NEW global index:
  word1 word2 | url1 8 url4 2
  word3 | url3 2 url9 1

Remember to error gracefully, particularly when reading the global index file.
*/

const fs = require('fs');
const readline = require('readline');
// The `compare` function can be used for sorting.
const compare = (a, b) => {
  if (a.freq > b.freq) {
    return -1;
  } else if (a.freq < b.freq) {
    return 1;
  } else {
    return 0;
  }
};
const rl = readline.createInterface({
  input: process.stdin,
});

// 1. Read the incoming local index data from standard input (stdin) line by line.
let localIndex = '';
rl.on('line', (line) => {
  localIndex += line + '\n';
});

rl.on('close', () => {
  // 2. Read the global index name/location, using process.argv
  // and call printMerged as a callback
  const globalPath = process.argv[2];
  if (!globalPath) {
    // no global index provided; just print transformed local into global format
    printMerged(null, '');
    return;
  }
  fs.readFile(globalPath, {encoding: 'utf-8'}, printMerged);
});

const printMerged = (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Split the data into an array of lines
  const localIndexLines = localIndex.split('\n');
  const globalIndexLines = data.split('\n');

  localIndexLines.pop();
  globalIndexLines.pop();

  const local = {};
  const global = {};

  // 3. For each line in `localIndexLines`, parse them and add them to the `local` object
  // where keys are terms and values store a url->freq map (one entry per url).
  for (const line of localIndexLines) {
    const parts = line.split('|');
    if (parts.length !== 3) continue;
    const term = parts[0].trim();
    const freqStr = parts[1].trim();
    const url = parts[2].trim();
    if (!term || !url) continue;
    const freq = parseInt(freqStr, 10) || 0;
    if (!local[term]) local[term] = {};
    local[term][url] = (local[term][url] || 0) + freq;
  }

  // 4. For each line in `globalIndexLines`, parse them and add them to the `global` object
  // where keys are terms and values are url->freq maps (one entry per url).
  // Use the .trim() method to remove leading and trailing whitespace from a string.
  for (const line of globalIndexLines) {
    const parts = line.split('|');
    if (parts.length !== 2) continue;
    const term = parts[0].trim();
    const rest = parts[1].trim();
    if (!term || !rest) continue;
    const tokens = rest.split(/\s+/);
    const grouped = {};
    for (let i = 0; i + 1 < tokens.length; i += 2) {
      const url = tokens[i];
      const freq = parseInt(tokens[i + 1], 10) || 0;
      grouped[url] = (grouped[url] || 0) + freq;
    }
    global[term] = grouped; // Map<url, freq>
  }

  // 5. Merge the local index into the global index:
  // - For each term in the local index, if the term exists in the global index:
  //     - Merge by url so there is at most one entry per url.
  //     - Sum frequencies for duplicate urls.
  // - If the term does not exist in the global index:
  //     - Add it as a new entry with the local index's data.
  // 6. Print the merged index to the console in the same format as the global index file:
  //    - Each line contains a term, followed by a pipe (`|`), followed by space-separated pairs of `url` and `freq`.
  //    - Terms should be printed in alphabetical order.
  for (const term of Object.keys(local)) {
    if (!global[term]) {
      global[term] = {...local[term]};
    } else {
      const g = global[term];
      const l = local[term];
      for (const url of Object.keys(l)) {
        g[url] = (g[url] || 0) + l[url];
      }
    }
  }

  const terms = Object.keys(global).sort();
  for (const term of terms) {
    const entries = Object.keys(global[term]).map((url) => ({url, freq: global[term][url]}));
    entries.sort(compare);
    const right = entries.map(({url, freq}) => `${url} ${freq}`).join(' ');
    console.log(`${term} | ${right}`);
  }
};
