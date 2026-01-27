#!/bin/bash
# This is a student test
# Component: query.js - Tests for search query functionality

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== query.js Student Tests ==="

# Setup: Create a test index
TEMP_INDEX=$(mktemp)
cat > "$TEMP_INDEX" << 'EOF'
run | url1 5 url2 3
jump | url3 2
run fast | url1 1
apple | url4 10
banana | url5 5
EOF

# Backup original index
cp d/global-index.txt d/global-index.txt.bak 2>/dev/null || true
cp "$TEMP_INDEX" d/global-index.txt

# Test 1: Find matching terms
echo "Test 1: Find matching terms"
result=$(./query.js running)
if echo "$result" | grep -q "run"; then
    echo "  PASS: Found stemmed match for 'running'"
    ((PASS++))
else
    echo "  FAIL: Did not find match for 'running'"
    ((FAIL++))
fi

# Test 2: Non-existent term returns empty
echo "Test 2: Non-existent term"
result=$(./query.js zebra)
if [ -z "$result" ]; then
    echo "  PASS: Non-existent term returns empty"
    ((PASS++))
else
    echo "  FAIL: Non-existent term should return empty"
    ((FAIL++))
fi

# Test 3: Multi-word query
echo "Test 3: Multi-word query"
cat > d/global-index.txt << 'EOF'
quick brown | url1 5
brown fox | url2 3
quick brown fox | url3 1
EOF
result=$(./query.js quick brown)
if echo "$result" | grep -q "quick brown"; then
    echo "  PASS: Multi-word query works"
    ((PASS++))
else
    echo "  FAIL: Multi-word query failed"
    ((FAIL++))
fi


# Cleanup: Restore original index
mv d/global-index.txt.bak d/global-index.txt 2>/dev/null || true
rm -f "$TEMP_INDEX"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -eq 0 ]; then
    echo "$0 success: all tests passed"
    exit 0
else
    echo "$0 failure: $FAIL tests failed"
    exit 1
fi
