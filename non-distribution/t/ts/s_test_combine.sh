#!/bin/bash
# This is a student test
# Component: combine.sh - Tests for n-gram generation

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== combine.sh Student Tests ==="

# Test 1: Generate 1-grams
echo "Test 1: Generate 1-grams"
input=$(printf "a\nb\nc\n")
result=$(echo "$input" | c/combine.sh)
if echo "$result" | grep -q "^a$" && echo "$result" | grep -q "^b$" && echo "$result" | grep -q "^c$"; then
    echo "  PASS: 1-grams generated correctly"
    ((PASS++))
else
    echo "  FAIL: 1-grams not generated correctly"
    ((FAIL++))
fi

# Test 2: Generate 2-grams
echo "Test 2: Generate 2-grams"
if echo "$result" | grep -qE "a[[:space:]]+b|a b" && echo "$result" | grep -qE "b[[:space:]]+c|b c"; then
    echo "  PASS: 2-grams generated correctly"
    ((PASS++))
else
    echo "  FAIL: 2-grams not generated correctly"
    ((FAIL++))
fi

# Test 3: Generate 3-grams
echo "Test 3: Generate 3-grams"
if echo "$result" | grep -qE "a[[:space:]]+b[[:space:]]+c|a b c"; then
    echo "  PASS: 3-grams generated correctly"
    ((PASS++))
else
    echo "  FAIL: 3-grams not generated correctly"
    ((FAIL++))
fi

# Test 4: Single word input (only 1-gram)
echo "Test 4: Single word input"
result=$(echo "word" | c/combine.sh)
line_count=$(echo "$result" | grep -c .)
if [ "$line_count" -eq 1 ] && echo "$result" | grep -q "word"; then
    echo "  PASS: Single word produces only 1-gram"
    ((PASS++))
else
    echo "  FAIL: Single word should produce only 1-gram"
    ((FAIL++))
fi

# Test 5: Empty input
echo "Test 5: Empty input"
result=$(echo "" | c/combine.sh | wc -l | tr -d ' ')
if [ "$result" -eq 0 ] || [ "$result" -eq 1 ]; then
    echo "  PASS: Empty input handled correctly"
    ((PASS++))
else
    echo "  FAIL: Empty input should return empty output"
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
