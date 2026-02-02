// @ts-check

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
  const type = typeof object;

  // Handle null (typeof null === 'object', so check first)
  if (object === null) {
    return JSON.stringify({ type: 'null', value: '' });
  }

  // Handle undefined
  if (type === 'undefined') {
    return JSON.stringify({ type: 'undefined', value: '' });
  }

  // Handle number (including NaN, Infinity, -Infinity)
  if (type === 'number') {
    return JSON.stringify({ type: 'number', value: String(object) });
  }

  // Handle string
  if (type === 'string') {
    return JSON.stringify({ type: 'string', value: object });
  }

  // Handle boolean
  if (type === 'boolean') {
    return JSON.stringify({ type: 'boolean', value: String(object) });
  }

  // Handle function
  if (type === 'function') {
    return JSON.stringify({ type: 'function', value: object.toString() });
  }

  // Handle object types (Array, Date, Error, plain Object)
  if (type === 'object') {
    // Handle Array
    if (Array.isArray(object)) {
      const serializedValues = {};
      for (let i = 0; i < object.length; i++) {
        serializedValues[i] = JSON.parse(serialize(object[i]));
      }
      return JSON.stringify({ type: 'array', value: serializedValues });
    }

    // Handle Date
    if (object instanceof Date) {
      return JSON.stringify({ type: 'date', value: object.toISOString() });
    }

    // Handle Error
    if (object instanceof Error) {
      const errorObj = {
        name: JSON.parse(serialize(object.name)),
        message: JSON.parse(serialize(object.message)),
        cause: JSON.parse(serialize(object.cause)),
      };
      return JSON.stringify({
        type: 'error',
        value: { type: 'object', value: errorObj },
      });
    }

    // Handle plain Object
    const serializedObj = {};
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        serializedObj[key] = JSON.parse(serialize(object[key]));
      }
    }
    return JSON.stringify({ type: 'object', value: serializedObj });
  }

  // For now, throw an error for unsupported types
  throw new Error(`Unsupported type: ${type}`);
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
  const { type, value } = parsed;

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
    return (0, eval)('(' + value + ')');
  }

  // Handle array
  if (type === 'array') {
    const result = [];
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[parseInt(key)] = deserialize(JSON.stringify(value[key]));
      }
    }
    return result;
  }

  // Handle date
  if (type === 'date') {
    return new Date(value);
  }

  // Handle error
  if (type === 'error') {
    const errorObj = deserialize(JSON.stringify(value));
    const error = new Error(errorObj.message);
    error.name = errorObj.name;
    if (errorObj.cause !== undefined) {
      error.cause = errorObj.cause;
    }
    return error;
  }

  // Handle object
  if (type === 'object') {
    const result = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = deserialize(JSON.stringify(value[key]));
      }
    }
    return result;
  }

  // Unknown type
  throw new Error(`Unsupported type: ${type}`);
}

module.exports = {
  serialize,
  deserialize,
};
