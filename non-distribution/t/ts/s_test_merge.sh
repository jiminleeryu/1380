#!/bin/bash
# This is a student test
# Component: merge.js - Tests for merging local index into global

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== merge.js Student Tests ==="

# Setup temp files
TEMP_GLOBAL=$(mktemp)
TEMP_LOCAL=$(mktemp)

# Test 1: Basic merge functionality
echo "Test 1: Basic merge functionality"
cat > "$TEMP_GLOBAL" << 'EOF'
word1 word2 | url4 2
word3 | url3 2
EOF

local_input=$(printf "word1 word2 | 8 | url1\nword3 | 1 | url9\n")
result=$(echo "$local_input" | c/merge.js "$TEMP_GLOBAL")
if echo "$result" | grep -q "word1 word2" && echo "$result" | grep -q "url1" && echo "$result" | grep -q "url4"; then
    echo "  PASS: Basic merge works correctly"
    ((PASS++))
else
    echo "  FAIL: Basic merge not working"
    ((FAIL++))
fi

# Test 2: Empty global index
echo "Test 2: Empty global index"
echo "" > "$TEMP_GLOBAL"
local_input="word | 5 | url1"
result=$(echo "$local_input" | c/merge.js "$TEMP_GLOBAL")
if echo "$result" | grep -q "word" && echo "$result" | grep -q "url1"; then
    echo "  PASS: Empty global index handled"
    ((PASS++))
else
    echo "  FAIL: Empty global index not handled correctly"
    ((FAIL++))
fi

# Test 3: Empty local input
echo "Test 3: Empty local input"
cat > "$TEMP_GLOBAL" << 'EOF'
word | url1 5
EOF
result=$(echo "" | c/merge.js "$TEMP_GLOBAL")
if echo "$result" | grep -q "word" && echo "$result" | grep -q "url1 5"; then
    echo "  PASS: Empty local input preserves global"
    ((PASS++))
else
    echo "  FAIL: Empty local input should preserve global"
    ((FAIL++))
fi

# Test 4: Performance - Throughput measurement
echo "Test 4: Performance throughput"
NUM_ENTRIES=100
global_entries=""
local_entries=""
for idx in $(seq 1 $NUM_ENTRIES); do
    global_entries="${global_entries}word${idx} | url1 ${idx}\n"
    local_entries="${local_entries}word${idx} | $((idx + 5)) | url2\n"
done
printf '%b' "$global_entries" > "$TEMP_GLOBAL"

start_time=$(date +%s.%N)
printf '%b' "$local_entries" | c/merge.js "$TEMP_GLOBAL" > /dev/null
end_time=$(date +%s.%N)

duration=$(echo "$end_time - $start_time" | bc)
throughput=$(echo "scale=2; $NUM_ENTRIES / $duration" | bc)
echo "  INFO: Merged $NUM_ENTRIES entries in ${duration}s (${throughput} entries/sec)"
if (( $(echo "$throughput > 10" | bc -l) )); then
    echo "  PASS: Throughput acceptable (>10 entries/sec)"
    ((PASS++))
else
    echo "  FAIL: Throughput too low (<10 entries/sec)"
    ((FAIL++))
fi

# Cleanup
rm -f "$TEMP_GLOBAL" "$TEMP_LOCAL"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -eq 0 ]; then
    echo "$0 success: all tests passed"
    exit 0
else
    echo "$0 failure: $FAIL tests failed"
    exit 1
fi
