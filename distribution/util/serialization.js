// @ts-check

// Native function/object mappings - maps native values to unique identifiers
const nativeToId = new Map();
const idToNative = new Map();

/**
 * Check if a value is native (function with [native code] or built-in object)
 * @param {any} val
 * @returns {boolean}
 */
function isNativeValue(val) {
  if (typeof val === 'function') {
    try {
      return val.toString().includes('[native code]');
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Register a value in the native maps
 * @param {any} val
 * @param {string} id
 */
function registerNative(val, id) {
  if (!nativeToId.has(val)) {
    nativeToId.set(val, id);
    idToNative.set(id, val);
  }
}

/**
 * Recursively discover all functions from a root object
 * @param {any} root - The root object to traverse
 * @param {string} rootName - The name/path of the root object
 * @param {Set} visited - Set of already visited objects to handle cycles
 * @param {boolean} registerAll - Whether to register all functions (not just native)
 */
function discoverFunctions(root, rootName, visited, registerAll = false) {
  if (root === null || root === undefined) return;
  if (visited.has(root)) return;

  const type = typeof root;
  if (type !== 'object' && type !== 'function') return;

  visited.add(root);

  // If this is a function, register it
  if (type === 'function') {
    if (registerAll || isNativeValue(root)) {
      registerNative(root, rootName);
    }
  }

  // Traverse properties
  try {
    const keys = Object.getOwnPropertyNames(root);
    for (const key of keys) {
      // Skip certain properties that cause issues
      if (key === 'constructor' || key === 'prototype' || key === 'caller' ||
        key === 'callee' || key === 'arguments' || key === '__proto__') {
        continue;
      }

      try {
        const val = root[key];
        if (val === null || val === undefined) continue;
        if (visited.has(val)) continue;

        const valType = typeof val;
        if (valType === 'function' || valType === 'object') {
          const newPath = `${rootName}.${key}`;
          discoverFunctions(val, newPath, visited, registerAll);
        }
      } catch (e) {
        // Skip properties that throw on access
      }
    }
  } catch (e) {
    // Skip objects that don't allow property enumeration
  }
}

// Initialize the native maps by discovering from root objects
const visited = new Set();

// E4: Dynamically discover ALL builtin libraries using require('repl')._builtinLibs
// This ensures support for all native objects in the current version of Node.js
const builtinLibs = require('repl')._builtinLibs || [];

for (const libName of builtinLibs) {
  try {
    // Normalize module name for use as identifier (e.g., 'fs/promises' -> 'fs_promises')
    const normalizedName = libName.replace(/\//g, '_');
    const lib = require(libName);
    discoverFunctions(lib, normalizedName, visited, true);
  } catch (e) {
    // Skip modules that fail to load (some may require specific conditions)
  }
}

// Discover from global objects - important builtins accessible via global
const safeGlobals = ['console', 'process', 'Buffer', 'JSON', 'Math',
  'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'Error',
  'RegExp', 'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
  'Proxy', 'Reflect', 'Symbol', 'BigInt', 'Intl', 'Atomics',
  'SharedArrayBuffer', 'ArrayBuffer', 'DataView',
  'Int8Array', 'Uint8Array', 'Uint8ClampedArray',
  'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array',
  'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array'];

for (const name of safeGlobals) {
  if (global[name] !== undefined) {
    discoverFunctions(global[name], name, visited, true);
  }
}

/**
 * Check if a function is native (contains [native code]) or from a tracked module
 * @param {Function} fn
 * @returns {boolean}
 */
function isNativeFunction(fn) {
  // Check if it's in our map (includes fs, os, path, etc.)
  if (nativeToId.has(fn)) {
    return true;
  }
  // Also check if it has [native code]
  return isNativeValue(fn);
}

/**
 * Try to identify a native/module function by its characteristics
 * @param {Function} fn
 * @returns {string|null}
 */
function identifyNativeFunction(fn) {
  // Check our dynamically built map
  if (nativeToId.has(fn)) {
    return nativeToId.get(fn);
  }

  // For Jest compatibility: check if it matches known natives by reference
  // Jest may replace console methods, so we need to check the current environment
  const consoleLog = require('console').log;
  const consoleError = require('console').error;

  if (fn === consoleLog) {
    return 'console.log';
  }
  if (fn === consoleError) {
    return 'console.error';
  }

  return null;
}

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
  // Map to track seen objects and their paths (for cycle detection)
  const seen = new Map();
  let nextId = 0;

  function serializeHelper(obj, path) {
    const type = typeof obj;

    // Handle null (typeof null === 'object', so check first)
    if (obj === null) {
      return { type: 'null', value: '' };
    }

    // Handle undefined
    if (type === 'undefined') {
      return { type: 'undefined', value: '' };
    }

    // Handle number (including NaN, Infinity, -Infinity)
    if (type === 'number') {
      return { type: 'number', value: String(obj) };
    }

    // Handle string
    if (type === 'string') {
      return { type: 'string', value: obj };
    }

    // Handle boolean
    if (type === 'boolean') {
      return { type: 'boolean', value: String(obj) };
    }

    // Handle function - check for cycles/duplicates
    if (type === 'function') {
      if (seen.has(obj)) {
        return { type: 'reference', value: seen.get(obj) };
      }
      const id = String(nextId++);
      seen.set(obj, id);

      // Check if this is a known native function
      const nativeId = identifyNativeFunction(obj);
      if (nativeId) {
        return { type: 'native', value: nativeId, id: id };
      }

      // Check if this is a native function (but not in our map)
      if (isNativeFunction(obj)) {
        // For unknown native functions, use a descriptive identifier
        return { type: 'native', value: obj.name || 'unknown', id: id };
      }

      return { type: 'function', value: obj.toString(), id: id };
    }

    // Handle object types (Array, Date, Error, plain Object)
    if (type === 'object') {
      // Check for cycles - if we've seen this object before, return a reference
      if (seen.has(obj)) {
        return { type: 'reference', value: seen.get(obj) };
      }

      // Assign a unique ID to this object
      const id = String(nextId++);
      seen.set(obj, id);

      // Handle Date
      if (obj instanceof Date) {
        return { type: 'date', value: obj.toISOString(), id: id };
      }

      // Handle Error
      if (obj instanceof Error) {
        const errorObj = {
          name: serializeHelper(obj.name, path + '.name'),
          message: serializeHelper(obj.message, path + '.message'),
          cause: serializeHelper(obj.cause, path + '.cause'),
        };
        return {
          type: 'error',
          value: { type: 'object', value: errorObj },
          id: id,
        };
      }

      // Handle Array
      if (Array.isArray(obj)) {
        const serializedValues = {};
        for (let i = 0; i < obj.length; i++) {
          serializedValues[i] = serializeHelper(obj[i], path + '[' + i + ']');
        }
        return { type: 'array', value: serializedValues, id: id };
      }

      // Handle plain Object
      const serializedObj = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          serializedObj[key] = serializeHelper(obj[key], path + '.' + key);
        }
      }
      return { type: 'object', value: serializedObj, id: id };
    }

    // For now, throw an error for unsupported types
    throw new Error(`Unsupported type: ${type}`);
  }

  return JSON.stringify(serializeHelper(object, 'root'));
}


/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
  if (typeof string !== 'string') {
    throw new Error(`Invalid argument type: ${typeof string}.`);
  }

  const parsed = JSON.parse(string);

  // Map from ID to deserialized object (for resolving references)
  const idToObject = new Map();
  // List of deferred reference assignments
  const deferredRefs = [];

  function deserializeHelper(node, parentObj, parentKey) {
    const { type, value, id } = node;

    // Handle reference - defer resolution until all objects are created
    if (type === 'reference') {
      deferredRefs.push({ parentObj, parentKey, refId: value });
      return undefined; // Placeholder, will be resolved later
    }

    // Handle null
    if (type === 'null') {
      return null;
    }

    // Handle undefined
    if (type === 'undefined') {
      return undefined;
    }

    // Handle number (including NaN, Infinity, -Infinity)
    if (type === 'number') {
      return Number(value);
    }

    // Handle string
    if (type === 'string') {
      return value;
    }

    // Handle boolean
    if (type === 'boolean') {
      return value === 'true';
    }

    // Handle function
    if (type === 'function') {
      // Use indirect eval to create the function in global scope
      const fn = (0, eval)('(' + value + ')');
      if (id !== undefined) {
        idToObject.set(id, fn);
      }
      return fn;
    }

    // Handle native function
    if (type === 'native') {
      let fn = null;

      // For Jest compatibility: always resolve console methods dynamically first
      if (value.startsWith('console.')) {
        const method = value.substring(8);
        fn = require('console')[method];
      } else {
        // E4: Dynamically resolve any builtin module
        // The value format is "moduleName.method" or "moduleName_submodule.method"
        // e.g., "fs.readFile", "fs_promises.readFile", "crypto.createHash"
        const parts = value.split('.');
        if (parts.length >= 2) {
          // Convert normalized name back to module name (e.g., 'fs_promises' -> 'fs/promises')
          const moduleName = parts[0].replace(/_/g, '/');
          const builtinLibs = require('repl')._builtinLibs || [];

          // Check if this is a builtin module
          if (builtinLibs.includes(moduleName)) {
            try {
              let mod = require(moduleName);
              // Traverse the rest of the path
              for (let i = 1; i < parts.length && mod; i++) {
                mod = mod[parts[i]];
              }
              fn = mod;
            } catch (e) {
              // Module loading failed, try other resolution methods
            }
          }
        }

        // If not resolved from builtin, check our static map
        if (!fn) {
          fn = idToNative.get(value);
        }
      }

      // If still not found, try to resolve from global path
      if (!fn) {
        const parts = value.split('.');
        fn = global;
        for (const part of parts) {
          if (fn && fn[part] !== undefined) {
            fn = fn[part];
          } else {
            fn = null;
            break;
          }
        }
      }

      if (fn) {
        if (id !== undefined) {
          idToObject.set(id, fn);
        }
        return fn;
      }
      // If not found, throw an error
      throw new Error(`Unknown native function: ${value}`);
    }

    // Handle date
    if (type === 'date') {
      const date = new Date(value);
      if (id !== undefined) {
        idToObject.set(id, date);
      }
      return date;
    }

    // Handle error
    if (type === 'error') {
      const error = new Error();
      if (id !== undefined) {
        idToObject.set(id, error);
      }
      const errorObj = deserializeHelper(value, null, null);
      error.name = errorObj.name;
      error.message = errorObj.message;
      if (errorObj.cause !== undefined) {
        error.cause = errorObj.cause;
      }
      return error;
    }

    // Handle array
    if (type === 'array') {
      const result = [];
      if (id !== undefined) {
        idToObject.set(id, result);
      }
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const idx = parseInt(key);
          result[idx] = deserializeHelper(value[key], result, idx);
        }
      }
      return result;
    }

    // Handle object
    if (type === 'object') {
      const result = {};
      if (id !== undefined) {
        idToObject.set(id, result);
      }
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = deserializeHelper(value[key], result, key);
        }
      }
      return result;
    }

    // Unknown type
    throw new Error(`Unsupported type: ${type}`);
  }

  // First pass: deserialize everything, collecting deferred references
  const result = deserializeHelper(parsed, null, null);

  // Second pass: resolve all deferred references
  for (const ref of deferredRefs) {
    const { parentObj, parentKey, refId } = ref;
    if (parentObj !== null && parentKey !== null) {
      parentObj[parentKey] = idToObject.get(refId);
    }
  }

  return result;
}

module.exports = {
  serialize,
  deserialize,
};
