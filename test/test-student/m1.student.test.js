/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

test('(1 pts) student test', () => {
  // Test serialization of deeply nested objects
  const util = distribution.util;
  const deepObject = {
    level1: {
      level2: {
        level3: {
          level4: {
            value: 'deeply nested',
            number: 42,
          },
        },
      },
    },
  };
  const serialized = util.serialize(deepObject);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toEqual(deepObject);
  expect(deserialized.level1.level2.level3.level4.value).toEqual('deeply nested');
  expect(deserialized.level1.level2.level3.level4.number).toEqual(42);
});


test('(1 pts) student test', () => {
  // Test serialization of mixed arrays with multiple types
  const util = distribution.util;
  const mixedArray = [
    'string',
    123,
    true,
    false,
    null,
    undefined,
    { key: 'value' },
    [1, 2, 3],
    new Date('2026-01-15'),
  ];
  const serialized = util.serialize(mixedArray);
  const deserialized = util.deserialize(serialized);
  expect(deserialized[0]).toEqual('string');
  expect(deserialized[1]).toEqual(123);
  expect(deserialized[2]).toEqual(true);
  expect(deserialized[3]).toEqual(false);
  expect(deserialized[4]).toBeNull();
  expect(deserialized[5]).toBeUndefined();
  expect(deserialized[6]).toEqual({ key: 'value' });
  expect(deserialized[7]).toEqual([1, 2, 3]);
  expect(deserialized[8].getTime()).toEqual(new Date('2026-01-15').getTime());
});


test('(1 pts) student test', () => {
  // Test serialization of functions that capture closure values
  const util = distribution.util;
  const addFunction = (a, b) => a + b;
  const multiplyFunction = function (x, y) {
    return x * y;
  };
  const objWithFuncs = {
    add: addFunction,
    multiply: multiplyFunction,
  };
  const serialized = util.serialize(objWithFuncs);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized.add).toEqual('function');
  expect(typeof deserialized.multiply).toEqual('function');
  expect(deserialized.add(3, 4)).toEqual(7);
  expect(deserialized.multiply(5, 6)).toEqual(30);
});

test('(1 pts) student test', () => {
  // Test serialization of special numeric values (NaN, Infinity, -Infinity)
  const util = distribution.util;
  const specialNumbers = {
    nan: NaN,
    posInfinity: Infinity,
    negInfinity: -Infinity,
    negZero: -0,
    maxSafe: Number.MAX_SAFE_INTEGER,
  };
  const serialized = util.serialize(specialNumbers);
  const deserialized = util.deserialize(serialized);
  expect(Number.isNaN(deserialized.nan)).toBe(true);
  expect(deserialized.posInfinity).toEqual(Infinity);
  expect(deserialized.negInfinity).toEqual(-Infinity);
  expect(deserialized.maxSafe).toEqual(Number.MAX_SAFE_INTEGER);
});

test('(1 pts) student test', () => {
  // Test serialization of strings with special characters (unicode, escape sequences)
  const util = distribution.util;
  const specialStrings = {
    unicode: '你好世界',
    emoji: '🎉🚀💻',
    escape: 'line1\nline2\ttab\\backslash\"quote',
    empty: '',
    spaces: '   spaces   ',
  };
  const serialized = util.serialize(specialStrings);
  const deserialized = util.deserialize(serialized);
  expect(deserialized.unicode).toEqual('你好世界');
  expect(deserialized.emoji).toEqual('🎉🚀💻');
  expect(deserialized.escape).toEqual('line1\nline2\ttab\\backslash\"quote');
  expect(deserialized.empty).toEqual('');
  expect(deserialized.spaces).toEqual('   spaces   ');
});
