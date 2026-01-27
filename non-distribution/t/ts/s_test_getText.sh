#!/bin/bash
# This is a student test
# Component: getText.js - Tests for text extraction from HTML

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== getText.js Student Tests ==="

# Test 1: Basic text extraction with nested tags
echo "Test 1: Nested HTML tags"
input='<div><span><b><i>Deep nested text</i></b></span></div>'
result=$(echo "$input" | c/getText.js)
if echo "$result" | grep -q "Deep nested text"; then
    echo "  PASS: Nested tags handled correctly"
    ((PASS++))
else
    echo "  FAIL: Nested tags not handled correctly"
    ((FAIL++))
fi

# Test 2: Script and style tags should be excluded
echo "Test 2: Script and style exclusion"
input='<div>Visible</div><script>var x = "hidden";</script><style>.class{color:red}</style><p>Also visible</p>'
result=$(echo "$input" | c/getText.js)
if echo "$result" | grep -q "Visible" && ! echo "$result" | grep -q "hidden"; then
    echo "  PASS: Script/style content excluded"
    ((PASS++))
else
    echo "  FAIL: Script/style content not properly excluded"
    ((FAIL++))
fi

# Test 3: Empty input handling
echo "Test 3: Empty input"
result=$(echo "" | c/getText.js)
if [ -z "$result" ]; then
    echo "  PASS: Empty input returns empty output"
    ((PASS++))
else
    echo "  FAIL: Empty input should return empty output"
    ((FAIL++))
fi

# Test 4: Performance - Throughput measurement
echo "Test 4: Performance throughput"
NUM_PAGES=50
input='<html><body><div><p>Hello world</p><a href="/link">Click here</a></div></body></html>'
large_input=$(printf "$input\n%.0s" $(seq 1 $NUM_PAGES))

start_time=$(date +%s.%N)
echo "$large_input" | c/getText.js > /dev/null
end_time=$(date +%s.%N)

duration=$(echo "$end_time - $start_time" | bc)
throughput=$(echo "scale=2; $NUM_PAGES / $duration" | bc)
echo "  INFO: Processed $NUM_PAGES pages in ${duration}s (${throughput} pages/sec)"
if (( $(echo "$throughput > 1" | bc -l) )); then
    echo "  PASS: Throughput acceptable (>1 page/sec)"
    ((PASS++))
else
    echo "  FAIL: Throughput too low (<1 page/sec)"
    ((FAIL++))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -eq 0 ]; then
    echo "$0 success: all tests passed"
    exit 0
else
    echo "$0 failure: $FAIL tests failed"
    exit 1
fi
