#!/bin/bash
# This is a student test
# Component: process.sh - Tests for text normalization and stopword removal

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== process.sh Student Tests ==="

# Test 1: Lowercase conversion
echo "Test 1: Lowercase conversion"
result=$(echo "HELLO World" | c/process.sh)
if ! echo "$result" | grep -q "HELLO" && ! echo "$result" | grep -q "World"; then
    echo "  PASS: Converted to lowercase"
    ((PASS++))
else
    echo "  FAIL: Not converted to lowercase"
    ((FAIL++))
fi

# Test 2: Stopword removal
echo "Test 2: Stopword removal"
result=$(echo "the quick brown fox" | c/process.sh)
if ! echo "$result" | grep -qw "the"; then
    echo "  PASS: Stopword 'the' removed"
    ((PASS++))
else
    echo "  FAIL: Stopword 'the' not removed"
    ((FAIL++))
fi

# Test 3: Punctuation removal
echo "Test 3: Punctuation handling"
result=$(echo "hello, world! how are you?" | c/process.sh)
if ! echo "$result" | grep -q "," && ! echo "$result" | grep -q "!" && ! echo "$result" | grep -q "?"; then
    echo "  PASS: Punctuation removed"
    ((PASS++))
else
    echo "  FAIL: Punctuation not removed"
    ((FAIL++))
fi

# Test 4: Empty input handling
echo "Test 4: Empty input handling"
result=$(echo "" | c/process.sh)
if [ -z "$result" ]; then
    echo "  PASS: Empty input returns empty output"
    ((PASS++))
else
    echo "  FAIL: Empty input should return empty output"
    ((FAIL++))
fi

# Test 5: Unicode/special character handling
echo "Test 5: Special character handling"
result=$(echo "café résumé" | c/process.sh)
if [ -n "$result" ]; then
    echo "  PASS: Special characters handled"
    ((PASS++))
else
    echo "  FAIL: Special characters not handled"
    ((FAIL++))
fi

# Test 6: Performance - Throughput measurement
echo "Test 6: Performance throughput"
NUM_LINES=200
text="The quick brown fox jumps over the lazy dog"
large_input=""
for _ in $(seq 1 $NUM_LINES); do
    large_input="${large_input}${text}\n"
done

start_time=$(date +%s.%N)
printf '%b' "$large_input" | c/process.sh > /dev/null
end_time=$(date +%s.%N)

duration=$(echo "$end_time - $start_time" | bc)
throughput=$(echo "scale=2; $NUM_LINES / $duration" | bc)
echo "  INFO: Processed $NUM_LINES lines in ${duration}s (${throughput} lines/sec)"
if (( $(echo "$throughput > 1" | bc -l) )); then
    echo "  PASS: Throughput acceptable (>1 line/sec)"
    ((PASS++))
else
    echo "  FAIL: Throughput too low (<1 line/sec)"
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
