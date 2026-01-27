#!/bin/bash
# This is a student test
# Component: End-to-end pipeline test with performance characterization

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

PASS=0
FAIL=0

echo "=== End-to-End Pipeline Student Tests ==="

# Setup: Create test data
TEMP_DIR=$(mktemp -d)
TEST_HTML="$TEMP_DIR/test.html"
cat > "$TEST_HTML" << 'EOF'
<html>
<head><title>Test Page</title></head>
<body>
<h1>Welcome to Testing</h1>
<p>This is a test page with some sample content for indexing.</p>
<p>The quick brown fox jumps over the lazy dog.</p>
<a href="/page1">Page One</a>
<a href="/page2">Page Two</a>
</body>
</html>
EOF

# Backup global index
cp d/global-index.txt d/global-index.txt.bak 2>/dev/null || true
echo "" > d/global-index.txt

# Test 1: Full indexing pipeline
echo "Test 1: Full indexing pipeline (getText -> process -> stem -> combine -> invert -> merge)"
url="http://test.com/page"

start_time=$(date +%s.%N)
cat "$TEST_HTML" | c/getText.js | c/process.sh | c/stem.js | c/combine.sh | c/invert.sh "$url" | c/merge.js d/global-index.txt > d/temp-index.txt
mv d/temp-index.txt d/global-index.txt
end_time=$(date +%s.%N)

pipeline_time=$(echo "$end_time - $start_time" | bc)
echo "  INFO: Pipeline completed in ${pipeline_time}s"

# Check that something was indexed
if [ -s d/global-index.txt ]; then
    echo "  PASS: Pipeline produced output"
    ((PASS++))
else
    echo "  FAIL: Pipeline produced no output"
    ((FAIL++))
fi

# Test 2: Query the indexed content
echo "Test 2: Query indexed content"
result=$(./query.js fox)
if [ -n "$result" ]; then
    echo "  PASS: Query found indexed content"
    ((PASS++))
else
    echo "  FAIL: Query could not find indexed content"
    ((FAIL++))
fi

# Test 3: Pipeline throughput measurement
echo "Test 3: Pipeline throughput (multiple pages)"
NUM_PAGES=10
multi_html=""
for i in $(seq 1 $NUM_PAGES); do
    multi_html="${multi_html}<html><body><p>Page $i content with words like testing indexing searching.</p></body></html>\n"
done

echo "" > d/global-index.txt
start_time=$(date +%s.%N)
for i in $(seq 1 $NUM_PAGES); do
    page_html="<html><body><p>Page $i content with words like testing indexing searching.</p></body></html>"
    echo "$page_html" | c/getText.js | c/process.sh | c/stem.js | c/combine.sh | c/invert.sh "http://test.com/page$i" | c/merge.js d/global-index.txt > d/temp-index.txt
    mv d/temp-index.txt d/global-index.txt
done
end_time=$(date +%s.%N)

duration=$(echo "$end_time - $start_time" | bc)
throughput=$(echo "scale=2; $NUM_PAGES / $duration" | bc)
echo "  INFO: Indexed $NUM_PAGES pages in ${duration}s (${throughput} pages/sec)"

if (( $(echo "$throughput > 0.1" | bc -l) )); then
    echo "  PASS: Indexing throughput acceptable (>0.1 pages/sec)"
    ((PASS++))
else
    echo "  FAIL: Indexing throughput too low"
    ((FAIL++))
fi

# Test 4: Query latency after indexing
echo "Test 4: Query latency measurement"
NUM_QUERIES=5
total_time=0

for i in $(seq 1 $NUM_QUERIES); do
    start_time=$(date +%s.%N)
    ./query.js testing > /dev/null
    end_time=$(date +%s.%N)
    query_time=$(echo "$end_time - $start_time" | bc)
    total_time=$(echo "$total_time + $query_time" | bc)
done

avg_latency=$(echo "scale=3; $total_time / $NUM_QUERIES * 1000" | bc)
query_throughput=$(echo "scale=2; $NUM_QUERIES / $total_time" | bc)
echo "  INFO: Query avg latency: ${avg_latency}ms, throughput: ${query_throughput} queries/sec"

if (( $(echo "$avg_latency < 5000" | bc -l) )); then
    echo "  PASS: Query latency acceptable (<5000ms)"
    ((PASS++))
else
    echo "  FAIL: Query latency too high"
    ((FAIL++))
fi

# Cleanup
rm -rf "$TEMP_DIR"
mv d/global-index.txt.bak d/global-index.txt 2>/dev/null || true

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -eq 0 ]; then
    echo "$0 success: all tests passed"
    exit 0
else
    echo "$0 failure: $FAIL tests failed"
    exit 1
fi
