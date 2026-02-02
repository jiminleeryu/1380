/**
 * M1 Performance Test - Serialization/Deserialization Latency Characterization
 *
 * This test harness measures the average latency of serialization and deserialization
 * across three different workload types:
 *   - T2: Base types (Number, String, Boolean, null, undefined)
 *   - T3: Functions
 *   - T4: Complex recursive structures (Object, Array, Date, Error)
 *
 * Uses Node.js high-resolution timers (perf_hooks) for accurate measurements.
 * Results are stored in-memory and printed only at the end.
 *
 * Run on:
 *   - Local development environment
 *   - AWS cloud environment
 */

const { performance } = require('perf_hooks');
const os = require('os');

require('../distribution.js')();
const distribution = globalThis.distribution;
const util = distribution.util;

// Configuration
const ITERATIONS = 1000; // Number of iterations per workload
const WARMUP_ITERATIONS = 100; // Warmup iterations to stabilize JIT

// In-memory storage for results (avoid I/O during measurement)
const results = {
    environment: {},
    t2_base_types: { serialize: [], deserialize: [] },
    t3_functions: { serialize: [], deserialize: [] },
    t4_complex: { serialize: [], deserialize: [] },
};

// Capture environment info
function captureEnvironment() {
    results.environment = {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || 'unknown',
        totalMemory: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        freeMemory: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
    };
}

// Generate test data for each workload type
function generateT2Data() {
    // Base types: Number, String, Boolean, null, undefined
    return [
        42,
        3.14159,
        -273.15,
        NaN,
        Infinity,
        -Infinity,
        'Hello, World!',
        'A longer string with special characters: \n\t\r"\'\\',
        '',
        true,
        false,
        null,
        undefined,
        0,
        Number.MAX_SAFE_INTEGER,
    ];
}

function generateT3Data() {
    // Functions of varying complexity
    return [
        (a, b) => a + b,
        function multiply(x, y) { return x * y; },
        () => 42,
        function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); },
        (arr) => arr.map((x) => x * 2),
        function greet(name) { return `Hello, ${name}!`; },
        (obj) => Object.keys(obj).length,
        function compose(f, g) { return (x) => f(g(x)); },
    ];
}

function generateT4Data() {
    // Complex recursive structures
    return [
        { a: 1, b: 'two', c: true },
        [1, 2, 3, 4, 5],
        { nested: { deep: { value: 42 } } },
        [1, [2, [3, [4, [5]]]]],
        new Date(),
        new Error('Test error'),
        {
            mixed: [1, 'two', true, null, { inner: 'value' }],
            date: new Date('2026-01-01'),
            error: new Error('nested error'),
        },
        Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })),
        {
            users: [
                { name: 'Alice', age: 30, active: true },
                { name: 'Bob', age: 25, active: false },
                { name: 'Charlie', age: 35, active: true },
            ],
            metadata: { version: '1.0', timestamp: new Date() },
        },
    ];
}

// Benchmark function - measures latency for a single operation
function measureLatency(operation) {
    const start = performance.now();
    operation();
    const end = performance.now();
    return end - start; // Returns milliseconds
}

// Run benchmark for a specific workload
function benchmarkWorkload(name, dataGenerator, resultKey) {
    const data = dataGenerator();

    // Warmup phase (not recorded)
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        for (const item of data) {
            const serialized = util.serialize(item);
            util.deserialize(serialized);
        }
    }

    // Measurement phase
    for (let i = 0; i < ITERATIONS; i++) {
        for (const item of data) {
            // Measure serialization
            let serialized;
            const serializeLatency = measureLatency(() => {
                serialized = util.serialize(item);
            });
            results[resultKey].serialize.push(serializeLatency);

            // Measure deserialization
            const deserializeLatency = measureLatency(() => {
                util.deserialize(serialized);
            });
            results[resultKey].deserialize.push(deserializeLatency);
        }
    }
}

// Calculate statistics
function calculateStats(latencies) {
    if (latencies.length === 0) return null;

    const sorted = [...latencies].sort((a, b) => a - b);
    const sum = latencies.reduce((a, b) => a + b, 0);
    const avg = sum / latencies.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Standard deviation
    const squaredDiffs = latencies.map((x) => Math.pow(x - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / latencies.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
        count: latencies.length,
        avg: avg.toFixed(6),
        min: min.toFixed(6),
        max: max.toFixed(6),
        p50: p50.toFixed(6),
        p95: p95.toFixed(6),
        p99: p99.toFixed(6),
        stdDev: stdDev.toFixed(6),
    };
}

// Print results at the end
function printResults() {
    console.log('\n' + '='.repeat(80));
    console.log('M1 SERIALIZATION LATENCY BENCHMARK RESULTS');
    console.log('='.repeat(80));

    console.log('\n--- Environment ---');
    console.log(`Platform: ${results.environment.platform} (${results.environment.arch})`);
    console.log(`CPUs: ${results.environment.cpus}x ${results.environment.cpuModel}`);
    console.log(`Memory: ${results.environment.totalMemory} total, ${results.environment.freeMemory} free`);
    console.log(`Node.js: ${results.environment.nodeVersion}`);
    console.log(`Timestamp: ${results.environment.timestamp}`);
    console.log(`Iterations: ${ITERATIONS} per workload item`);

    console.log('\n--- T2: Base Types (Number, String, Boolean, null, undefined) ---');
    console.log('Serialize:');
    console.log(JSON.stringify(calculateStats(results.t2_base_types.serialize), null, 2));
    console.log('Deserialize:');
    console.log(JSON.stringify(calculateStats(results.t2_base_types.deserialize), null, 2));

    console.log('\n--- T3: Functions ---');
    console.log('Serialize:');
    console.log(JSON.stringify(calculateStats(results.t3_functions.serialize), null, 2));
    console.log('Deserialize:');
    console.log(JSON.stringify(calculateStats(results.t3_functions.deserialize), null, 2));

    console.log('\n--- T4: Complex Structures (Object, Array, Date, Error) ---');
    console.log('Serialize:');
    console.log(JSON.stringify(calculateStats(results.t4_complex.serialize), null, 2));
    console.log('Deserialize:');
    console.log(JSON.stringify(calculateStats(results.t4_complex.deserialize), null, 2));

    // Summary table
    console.log('\n--- Summary (Average Latency in ms) ---');
    console.log('+-----------------+------------+---------------+');
    console.log('| Workload        | Serialize  | Deserialize   |');
    console.log('+-----------------+------------+---------------+');

    const t2Ser = calculateStats(results.t2_base_types.serialize);
    const t2Des = calculateStats(results.t2_base_types.deserialize);
    const t3Ser = calculateStats(results.t3_functions.serialize);
    const t3Des = calculateStats(results.t3_functions.deserialize);
    const t4Ser = calculateStats(results.t4_complex.serialize);
    const t4Des = calculateStats(results.t4_complex.deserialize);

    console.log(`| T2: Base Types  | ${t2Ser.avg.padStart(10)} | ${t2Des.avg.padStart(13)} |`);
    console.log(`| T3: Functions   | ${t3Ser.avg.padStart(10)} | ${t3Des.avg.padStart(13)} |`);
    console.log(`| T4: Complex     | ${t4Ser.avg.padStart(10)} | ${t4Des.avg.padStart(13)} |`);
    console.log('+-----------------+------------+---------------+');

    console.log('\n' + '='.repeat(80));
}

// Jest test wrapper (only runs under Jest)
if (typeof describe !== 'undefined') {
    describe('M1 Serialization Performance', () => {
        test('Latency characterization across workloads', () => {
            // Capture environment
            captureEnvironment();

            // Run benchmarks
            benchmarkWorkload('T2: Base Types', generateT2Data, 't2_base_types');
            benchmarkWorkload('T3: Functions', generateT3Data, 't3_functions');
            benchmarkWorkload('T4: Complex Structures', generateT4Data, 't4_complex');

            // Print results only at the end
            printResults();

            // Basic assertions to ensure tests ran
            expect(results.t2_base_types.serialize.length).toBeGreaterThan(0);
            expect(results.t3_functions.serialize.length).toBeGreaterThan(0);
            expect(results.t4_complex.serialize.length).toBeGreaterThan(0);
        });
    });
}

// Allow running directly with node (not just jest)
if (require.main === module) {
    captureEnvironment();
    console.log('Running M1 Serialization Latency Benchmark...');
    console.log('This may take a moment...\n');

    benchmarkWorkload('T2: Base Types', generateT2Data, 't2_base_types');
    benchmarkWorkload('T3: Functions', generateT3Data, 't3_functions');
    benchmarkWorkload('T4: Complex Structures', generateT4Data, 't4_complex');

    printResults();
}
