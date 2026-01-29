# non-distribution

This milestone aims (among others) to refresh (and confirm) everyone's
background on developing systems in the languages and libraries used in this
course.

By the end of this assignment you will be familiar with the basics of
JavaScript, shell scripting, stream processing, Docker containers, deployment
to AWS, and performance characterization—all of which will be useful for the
rest of the project.

Your task is to implement a simple search engine that crawls a set of web
pages, indexes them, and allows users to query the index. All the components
will run on a single machine.

## Getting Started

To get started with this milestone, run `npm install` inside this folder. To
execute the (initially unimplemented) crawler run `./engine.sh`. Use
`./query.js` to query the produced index. To run tests, do `npm run test`.
Initially, these will fail.

### Overview

The code inside `non-distribution` is organized as follows:

```
.
├── c            # The components of your search engine
├── d            # Data files like seed urls and the produced index
├── s            # Utility scripts for linting your solutions
├── t            # Tests for your search engine
├── README.md    # This file
├── crawl.sh     # The crawler
├── index.sh     # The indexer
├── engine.sh    # The orchestrator script that runs the crawler and the indexer
├── package.json # The npm package file that holds information like JavaScript dependencies
└── query.js     # The script you can use to query the produced global index
```

### Submitting

To submit your solution, run `./scripts/submit.sh` from the root of the stencil. This will create a
`submission.zip` file which you can upload to the autograder.

---

# M0: Setup & Centralized Computing

> Add your contact information below and in `package.json`.

* name: `Jimin Ryu`

* email: `jimin_ryu@brown.edu`

* cslogin: `jlryu`


## Summary

> Summarize your implementation, including the most challenging aspects; remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete M0 (`hours`), the total number of JavaScript lines you added, including tests (`jsloc`), the total number of shell lines you added, including for deployment and testing (`sloc`).


My implementation consists of 8 components. These include:
- `getText.js` - Extracts visible text content from HTML pages
- `getURLs.js` - Extracts and resolves URLs from HTML anchor tags
- `stem.js` - Applies Porter stemming algorithm to normalize words
- `process.sh` - Normalizes text (lowercase, removes stopwords and punctuation)
- `combine.sh` - Generates 1-grams, 2-grams, and 3-grams from token streams
- `invert.sh` - Creates inverted index entries with term frequencies
- `merge.js` - Merges local indices into the global index
- `query.js` - Searches the global index for user queries

The most challenging aspect was implementing the `merge.js` component because it required careful handling of the global index format, sorting entries by frequency, and correctly combining duplicate terms from multiple URLs while preserving the proper output structure.


## Correctness & Performance Characterization


> Describe how you characterized the correctness and performance of your implementation.


To characterize correctness, we developed 38 tests across 9 test files that test the following cases: basic functionality for each component (getText extraction, URL resolution, stemming, text processing, n-gram generation, index inversion, index merging, and querying), edge cases (empty inputs, malformed HTML, special characters, unicode handling, high-frequency words), and end-to-end pipeline integration testing.


*Performance*: The throughput of various subsystems is described in the `"throughput"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json. Performance tests measure:
- getText throughput: pages processed per second
- stem throughput: words stemmed per second  
- process throughput: lines processed per second
- invert throughput: tokens inverted per second
- merge throughput: entries merged per second
- query latency: milliseconds per query and queries per second
- end-to-end indexing pipeline: pages indexed per second


## Wild Guess

> How many lines of code do you think it will take to build the fully distributed, scalable version of your search engine? Add that number to the `"dloc"` portion of package.json, and justify your answer below.

I estimate approximately 5000-8000 lines of code will be needed for the fully distributed version. This estimate accounts for:
- Distributed communication layer (~1500 lines) - RPC, message passing, serialization
- Distributed coordination (~1000 lines) - Group membership, leader election, consensus
- Distributed storage (~1500 lines) - Partitioning, replication, consistency
- MapReduce framework (~1500 lines) - Job scheduling, fault tolerance, worker management
- Distributed crawler and indexer (~1000 lines) - URL frontier distribution, index partitioning
- Testing and utilities (~500 lines)
