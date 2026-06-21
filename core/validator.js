'use strict';

/**
 * VSL (Validator Spec Language) - Core validator
 * Implements the template's DSL for field-level validation
 */

const { throwAppError, ERROR_CODE } = require('./errors');

/**
 * Parse a VSL spec string into a structured spec object
 */
function parse(specString) {
  return parseBlock(specString.trim(), 'root');
}

function parseBlock(str, blockName) {
  const fields = {};
  // Extract content between outermost braces
  const start = str.indexOf('{');
  const end = findMatchingBrace(str, start);
  const inner = str.substring(start + 1, end).trim();
  const lines = inner.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Detect nested object blocks (multi-line)
    const nestedMatch = matchNestedBlock(lines, i);
    if (nestedMatch) {
      const { name, optional, isArray, optionalArray, block, linesConsumed } = nestedMatch;
      fields[name] = {
        type: 'object',
        optional: optional || optionalArray,
        isArray: isArray,
        nested: parseBlock(block, name),
      };
      i += linesConsumed;
      continue;
    }

    // Simple field
    const field = parseField(line);
    if (field) {
      fields[field.name] = field;
    }
    i++;
  }

  return fields;
}

function matchNestedBlock(lines, startIdx) {
  const line = lines[startIdx];
  // Patterns: "name {" or "name? {" or "name[] {" or "name[]? {"
  const match = line.match(/^(\w+)(\?|\[\]\?|\[\]?)?\s*\{/);
  if (!match && !line.match(/^(\w+)(\?|\[\]\?|\[\]?)?\s*$/)) return null;

  // Check if next line or this line opens a block
  let blockStr = '';
  let linesConsumed = 0;
  let braceDepth = 0;
  let collecting = false;
  let fieldName, optional, isArray, optionalArray;

  // Check if the block opener is on this line
  if (line.includes('{')) {
    const m = line.match(/^(\w+)(\[\]\?|\[\]|\?)?\s*\{/);
    if (!m) return null;
    fieldName = m[1];
    const modifier = m[2] || '';
    optional = modifier === '?';
    isArray = modifier === '[]' || modifier === '[]?';
    optionalArray = modifier === '[]?';

    blockStr = '{';
    braceDepth = 1;
    linesConsumed = 1;
    collecting = true;

    for (let j = startIdx + 1; j < lines.length; j++) {
      const l = lines[j];
      for (const ch of l) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      blockStr += '\n' + l;
      linesConsumed++;
      if (braceDepth === 0) break;
    }
  } else {
    // Block opener might be on next line — not typical in VSL, skip
    return null;
  }

  return { name: fieldName, optional, isArray, optionalArray, block: blockStr, linesConsumed };
}

function findMatchingBrace(str, openPos) {
  let depth = 0;
  for (let i = openPos; i < str.length; i++) {
    if (str[i] === '{') depth++;
    if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return str.length - 1;
}

function parseField(line) {
  // Pattern: name[modifier]? type[<constraints>][(enum)]
  // e.g.: "title string<trim|minLength:3|maxLength:100>"
  // e.g.: "status string(draft|published)"
  // e.g.: "links[]? object" (handled by nested block detector above)

  const match = line.match(/^(\w+)(\[\]\?|\[\]|\?)?\s+(\w+)(<[^>]+>)?(\([^)]+\))?/);
  if (!match) return null;

  const name = match[1];
  const modifier = match[2] || '';
  const type = match[3];
  const constraintStr = match[4] ? match[4].slice(1, -1) : '';
  const enumStr = match[5] ? match[5].slice(1, -1) : '';

  return {
    name,
    type,
    optional: modifier === '?' || modifier === '[]?',
    isArray: modifier === '[]' || modifier === '[]?',
    constraints: constraintStr ? constraintStr.split('|') : [],
    enum: enumStr ? enumStr.split('|') : [],
  };
}

/**
 * Validate data against a parsed spec
 * Returns cleaned/transformed data or throws on failure
 */
function validate(data, parsedSpec) {
  const result = {};
  const errors = [];

  for (const [fieldName, fieldSpec] of Object.entries(parsedSpec)) {
    const rawValue = data[fieldName];
    const isPresent = rawValue !== undefined && rawValue !== null;

    if (!isPresent) {
      if (!fieldSpec.optional) {
        errors.push(`'${fieldName}' is required`);
      } else {
        result[fieldName] = fieldSpec.isArray ? undefined : undefined;
      }
      continue;
    }

    if (fieldSpec.isArray) {
      if (!Array.isArray(rawValue)) {
        errors.push(`'${fieldName}' must be an array`);
        continue;
      }
      if (fieldSpec.type === 'object' && fieldSpec.nested) {
        const arrResult = [];
        for (let i = 0; i < rawValue.length; i++) {
          if (typeof rawValue[i] !== 'object' || Array.isArray(rawValue[i])) {
            errors.push(`'${fieldName}[${i}]' must be an object`);
            continue;
          }
          const nestedResult = validateNested(rawValue[i], fieldSpec.nested, `${fieldName}[${i}]`, errors);
          arrResult.push(nestedResult);
        }
        result[fieldName] = arrResult;
      } else {
        const arrResult = [];
        for (let i = 0; i < rawValue.length; i++) {
          const v = validateScalar(rawValue[i], fieldSpec, `${fieldName}[${i}]`, errors);
          arrResult.push(v);
        }
        result[fieldName] = arrResult;
      }
      continue;
    }

    if (fieldSpec.type === 'object' && fieldSpec.nested) {
      if (typeof rawValue !== 'object' || Array.isArray(rawValue)) {
        errors.push(`'${fieldName}' must be an object`);
        continue;
      }
      result[fieldName] = validateNested(rawValue, fieldSpec.nested, fieldName, errors);
      continue;
    }

    result[fieldName] = validateScalar(rawValue, fieldSpec, fieldName, errors);
  }

  if (errors.length > 0) {
    throwAppError(errors[0], ERROR_CODE.VALIDATION_ERR);
  }

  return { ...data, ...result };
}

function validateNested(obj, nestedSpec, prefix, errors) {
  const result = {};
  for (const [fieldName, fieldSpec] of Object.entries(nestedSpec)) {
    const rawValue = obj[fieldName];
    const isPresent = rawValue !== undefined && rawValue !== null;
    const key = `${prefix}.${fieldName}`;

    if (!isPresent) {
      if (!fieldSpec.optional) {
        errors.push(`'${key}' is required`);
      }
      continue;
    }

    if (fieldSpec.isArray) {
      if (!Array.isArray(rawValue)) {
        errors.push(`'${key}' must be an array`);
        continue;
      }
      if (fieldSpec.type === 'object' && fieldSpec.nested) {
        const arrResult = [];
        for (let i = 0; i < rawValue.length; i++) {
          const nr = validateNested(rawValue[i], fieldSpec.nested, `${key}[${i}]`, errors);
          arrResult.push(nr);
        }
        result[fieldName] = arrResult;
      } else {
        result[fieldName] = rawValue;
      }
      continue;
    }

    if (fieldSpec.type === 'object' && fieldSpec.nested) {
      if (typeof rawValue !== 'object' || Array.isArray(rawValue)) {
        errors.push(`'${key}' must be an object`);
        continue;
      }
      result[fieldName] = validateNested(rawValue, fieldSpec.nested, key, errors);
      continue;
    }

    result[fieldName] = validateScalar(rawValue, fieldSpec, key, errors);
  }
  return { ...obj, ...result };
}

function validateScalar(value, fieldSpec, key, errors) {
  let v = value;

  // Type check
  if (fieldSpec.type === 'string' && typeof v !== 'string') {
    errors.push(`'${key}' must be a string`);
    return v;
  }
  if (fieldSpec.type === 'number' && typeof v !== 'number') {
    errors.push(`'${key}' must be a number`);
    return v;
  }
  if (fieldSpec.type === 'boolean' && typeof v !== 'boolean') {
    errors.push(`'${key}' must be a boolean`);
    return v;
  }

  // Apply transform constraints first
  for (const constraint of fieldSpec.constraints) {
    if (constraint === 'trim' && typeof v === 'string') v = v.trim();
    if (constraint === 'lowercase' && typeof v === 'string') v = v.toLowerCase();
    if (constraint === 'uppercase' && typeof v === 'string') v = v.toUpperCase();
  }

  // Apply validation constraints
  for (const constraint of fieldSpec.constraints) {
    if (constraint.startsWith('minLength:')) {
      const min = parseInt(constraint.split(':')[1]);
      if (typeof v === 'string' && v.length < min) {
        errors.push(`'${key}' must be at least ${min} characters`);
      }
    } else if (constraint.startsWith('maxLength:')) {
      const max = parseInt(constraint.split(':')[1]);
      if (typeof v === 'string' && v.length > max) {
        errors.push(`'${key}' must be at most ${max} characters`);
      }
    } else if (constraint.startsWith('length:')) {
      const len = parseInt(constraint.split(':')[1]);
      if (typeof v === 'string' && v.length !== len) {
        errors.push(`'${key}' must be exactly ${len} characters`);
      }
    } else if (constraint.startsWith('lengthBetween:')) {
      const [min, max] = constraint.split(':')[1].split(',').map(Number);
      if (typeof v === 'string' && (v.length < min || v.length > max)) {
        errors.push(`'${key}' must be between ${min} and ${max} characters`);
      }
    } else if (constraint.startsWith('min:')) {
      const min = Number(constraint.split(':')[1]);
      if (typeof v === 'number' && v < min) {
        errors.push(`'${key}' must be at least ${min}`);
      }
    } else if (constraint.startsWith('max:')) {
      const max = Number(constraint.split(':')[1]);
      if (typeof v === 'number' && v > max) {
        errors.push(`'${key}' must be at most ${max}`);
      }
    } else if (constraint === 'isEmail') {
      if (typeof v === 'string' && !v.includes('@')) {
        errors.push(`'${key}' must be a valid email`);
      }
    }
  }

  // Enum check
  if (fieldSpec.enum && fieldSpec.enum.length > 0) {
    if (!fieldSpec.enum.includes(v)) {
      errors.push(`'${key}' must be one of: ${fieldSpec.enum.join(', ')}`);
    }
  }

  return v;
}

module.exports = { parse, validate };
