#!/bin/bash
# This is a student test
# Component: invert.sh - Tests for index inversion

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== invert.sh Student Tests ==="

# Test 1: Basic frequency counting
echo "Test 1: Basic frequency counting"
input=$(printf "a\nb\nb\n")
url="http://example.com/page"
result=$(echo "$input" | c/invert.sh "$url")
if echo "$result" | grep -q "a.*1" && echo "$result" | grep -q "b.*2"; then
    echo "  PASS: Frequencies counted correctly"
    ((PASS++))
else
    echo "  FAIL: Frequencies not counted correctly"
    ((FAIL++))
fi

# Test 2: URL included in output
echo "Test 2: URL included in output"
if echo "$result" | grep -q "http://example.com/page"; then
    echo "  PASS: URL included in output"
    ((PASS++))
else
    echo "  FAIL: URL not included in output"
    ((FAIL++))
fi

# Test 3: High frequency word handling
echo "Test 3: High frequency word"
input=$(printf "word\nword\nword\nword\nword\n")
result=$(echo "$input" | c/invert.sh "http://example.com/page")
if echo "$result" | grep -q "word" && echo "$result" | grep -q "5"; then
    echo "  PASS: High frequency counted correctly"
    ((PASS++))
else
    echo "  FAIL: High frequency not counted correctly"
    ((FAIL++))
fi

# Test 4: Performance - Throughput measurement
echo "Test 4: Performance throughput"
NUM_TOKENS=500
large_input=""
for _ in $(seq 1 100); do
    large_input="${large_input}apple\nbanana\ncherry\ndate\nelderberry\n"
done

start_time=$(date +%s.%N)
printf '%b' "$large_input" | c/invert.sh "http://example.com/page" > /dev/null
end_time=$(date +%s.%N)

duration=$(echo "$end_time - $start_time" | bc)
throughput=$(echo "scale=2; $NUM_TOKENS / $duration" | bc)
echo "  INFO: Inverted $NUM_TOKENS tokens in ${duration}s (${throughput} tokens/sec)"
if (( $(echo "$throughput > 10" | bc -l) )); then
    echo "  PASS: Throughput acceptable (>10 tokens/sec)"
    ((PASS++))
else
    echo "  FAIL: Throughput too low (<10 tokens/sec)"
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
