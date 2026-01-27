#!/bin/bash
# This is a student test
# Component: getURLs.js - Tests for URL extraction from HTML

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/../..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
PASS=0
FAIL=0

echo "=== getURLs.js Student Tests ==="

# Test 1: Relative URL resolution
echo "Test 1: Relative URL resolution"
input='<a href="/about">About</a>'
base="http://example.com/index.html"
result=$(echo "$input" | c/getURLs.js "$base")
if echo "$result" | grep -q "http://example.com/about"; then
    echo "  PASS: Relative URL resolved correctly"
    ((PASS++))
else
    echo "  FAIL: Relative URL not resolved correctly"
    ((FAIL++))
fi

# Test 2: Absolute URL passthrough
echo "Test 2: Absolute URL passthrough"
input='<a href="http://other.com/page">External</a>'
base="http://example.com/"
result=$(echo "$input" | c/getURLs.js "$base")
if echo "$result" | grep -q "http://other.com/page"; then
    echo "  PASS: Absolute URL passed through"
    ((PASS++))
else
    echo "  FAIL: Absolute URL not passed through"
    ((FAIL++))
fi

# Test 3: HTTP link extraction with various protocols present
echo "Test 3: HTTP link extraction"
input='<a href="javascript:alert(1)">JS</a><a href="mailto:test@test.com">Mail</a><a href="/real">Real</a>'
base="http://example.com/"
result=$(echo "$input" | c/getURLs.js "$base")
if echo "$result" | grep -q "http://example.com/real"; then
    echo "  PASS: HTTP URL extracted correctly"
    ((PASS++))
else
    echo "  FAIL: HTTP URL not extracted"
    ((FAIL++))
fi

# Test 4: Handle URLs with query parameters
echo "Test 4: URLs with query parameters"
input='<a href="/page?foo=bar&baz=qux">Link</a>'
base="http://example.com/"
result=$(echo "$input" | c/getURLs.js "$base")
if echo "$result" | grep -q "foo=bar"; then
    echo "  PASS: Query parameters preserved"
    ((PASS++))
else
    echo "  FAIL: Query parameters not preserved"
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
