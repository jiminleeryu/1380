#!/bin/bash
# This is a student test
# Component: stem.js - Tests for Porter stemming

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== stem.js Student Tests ==="

# Test 1: Basic stemming of common suffixes
echo "Test 1: Basic -ing suffix stemming"
result=$(echo "running" | c/stem.js)
if [ "$result" = "run" ]; then
    echo "  PASS: 'running' stems to 'run'"
    ((PASS++))
else
    echo "  FAIL: Expected 'run', got '$result'"
    ((FAIL++))
fi

# Test 2: Stemming -es suffix
echo "Test 2: -es suffix stemming"
result=$(echo "caresses" | c/stem.js)
if [ "$result" = "caress" ]; then
    echo "  PASS: 'caresses' stems to 'caress'"
    ((PASS++))
else
    echo "  FAIL: Expected 'caress', got '$result'"
    ((FAIL++))
fi

# Test 3: Empty lines should be skipped
echo "Test 3: Empty line handling"
result=$(printf "running\n\njumping\n" | c/stem.js | wc -l | tr -d ' ')
if [ "$result" = "2" ]; then
    echo "  PASS: Empty lines skipped correctly"
    ((PASS++))
else
    echo "  FAIL: Expected 2 lines, got $result"
    ((FAIL++))
fi

# Test 4: Already stemmed words
echo "Test 4: Already stemmed words"
result=$(echo "run" | c/stem.js)
if [ "$result" = "run" ]; then
    echo "  PASS: Already stemmed word unchanged"
    ((PASS++))
else
    echo "  FAIL: Expected 'run', got '$result'"
    ((FAIL++))
fi
