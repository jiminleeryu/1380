#!/bin/bash
# M1 Performance Benchmark Runner
# 
# Usage:
#   ./scripts/benchmark-m1.sh [dev|aws]
#
# This script runs the serialization latency benchmark and outputs
# results that can be copied into package.json report section.

ENV=${1:-dev}

echo "Running M1 Serialization Benchmark on $ENV environment..."
echo ""

cd "$(dirname "$0")/.." || exit 1

# Run the benchmark
node test/m1.perf.test.js

echo ""
echo "Copy the average latency values above into package.json report section:"
echo "  latency.${ENV}: [T2_serialize, T2_deserialize, T3_serialize, T3_deserialize, T4_serialize, T4_deserialize]"
