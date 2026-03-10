/**
 * Unit Tests for Core Utilities
 */

import {
  compressJSX,
  extractCodeBlock,
  convertToES3,
  wrapWithTryCatch,
  safeJsonParse,
  deepClone,
  generateId,
  nowISO,
} from '../utils';

describe('compressJSX', () => {
  it('should remove single-line comments', () => {
    const code = `var x = 1; // this is a comment
var y = 2;`;
    const result = compressJSX(code);
    expect(result).not.toContain('// this is a comment');
    expect(result).toContain('var x = 1');
    expect(result).toContain('var y = 2');
  });

  it('should remove multi-line comments', () => {
    const code = `var x = 1;
/* this is a
multi-line comment */
var y = 2;`;
    const result = compressJSX(code);
    expect(result).not.toContain('multi-line comment');
    expect(result).toContain('var x = 1');
    expect(result).toContain('var y = 2');
  });

  it('should compress multiple whitespace', () => {
    const code = `var x    =    1;`;
    const result = compressJSX(code);
    expect(result).toBe('var x = 1;');
  });

  it('should trim whitespace', () => {
    const code = `   var x = 1;   `;
    const result = compressJSX(code);
    expect(result).toBe('var x = 1;');
  });
});

describe('extractCodeBlock', () => {
  it('should extract JavaScript code block', () => {
    const response = `Here is the code:
\`\`\`javascript
var x = 1;
\`\`\`
That's all!`;
    const result = extractCodeBlock(response);
    expect(result).toBe('var x = 1;');
  });

  it('should extract jsx code block', () => {
    const response = `\`\`\`jsx
function test() { return 1; }
\`\`\``;
    const result = extractCodeBlock(response);
    expect(result).toBe('function test() { return 1; }');
  });

  it('should extract plain code block without language', () => {
    const response = `\`\`\`
var x = 1;
\`\`\``;
    const result = extractCodeBlock(response);
    expect(result).toBe('var x = 1;');
  });

  it('should return null when no code block found', () => {
    const response = 'No code here';
    const result = extractCodeBlock(response);
    expect(result).toBeNull();
  });

  it('should handle multiple code blocks and return first', () => {
    const response = `\`\`\`javascript
first block
\`\`\`
Some text
\`\`\`javascript
second block
\`\`\``;
    const result = extractCodeBlock(response);
    expect(result).toBe('first block');
  });
});

describe('convertToES3', () => {
  it('should convert let to var', () => {
    const code = 'let x = 1;';
    const result = convertToES3(code);
    expect(result).toBe('var x = 1;');
  });

  it('should convert const to var', () => {
    const code = 'const x = 1;';
    const result = convertToES3(code);
    expect(result).toBe('var x = 1;');
  });

  it('should convert arrow functions with expression body', () => {
    const code = 'var fn = (x) => x * 2;';
    const result = convertToES3(code);
    expect(result).toContain('function');
    expect(result).not.toContain('=>');
  });

  it('should convert arrow functions with block body', () => {
    const code = 'var fn = (x) => { return x * 2; };';
    const result = convertToES3(code);
    expect(result).toContain('function');
    expect(result).not.toContain('=>');
  });

  it('should convert template literals', () => {
    const code = 'var str = `Hello ${name}!`;';
    const result = convertToES3(code);
    expect(result).not.toContain('`');
    expect(result).toContain('+');
    expect(result).toContain('name');
  });

  it('should convert parameterless arrow functions', () => {
    const code = 'var fn = () => 42;';
    const result = convertToES3(code);
    expect(result).toContain('function()');
    expect(result).not.toContain('=>');
  });
});

describe('wrapWithTryCatch', () => {
  it('should wrap code with try-catch', () => {
    const code = 'var x = 1;';
    const result = wrapWithTryCatch(code);
    expect(result).toContain('try');
    expect(result).toContain('catch');
    expect(result).toContain('var x = 1;');
  });

  it('should include error alert in catch block', () => {
    const code = 'var x = 1;';
    const result = wrapWithTryCatch(code);
    expect(result).toContain('alert');
    expect(result).toContain('Error');
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJsonParse('{"key": "value"}');
    expect(result).toEqual({ key: 'value' });
  });

  it('should return null for invalid JSON', () => {
    const result = safeJsonParse('not json');
    expect(result).toBeNull();
  });

  it('should parse JSON arrays', () => {
    const result = safeJsonParse('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('should parse primitive JSON values', () => {
    expect(safeJsonParse('123')).toBe(123);
    expect(safeJsonParse('"string"')).toBe('string');
    expect(safeJsonParse('true')).toBe(true);
    expect(safeJsonParse('null')).toBe(null);
  });
});

describe('deepClone', () => {
  it('should clone simple objects', () => {
    const obj = { a: 1, b: 'test' };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone).not.toBe(obj);
  });

  it('should clone nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const clone = deepClone(obj);
    expect(clone).toEqual(obj);
    expect(clone.a).not.toBe(obj.a);
    expect(clone.a.b).not.toBe(obj.a.b);
  });

  it('should clone arrays', () => {
    const arr = [1, 2, { a: 3 }];
    const clone = deepClone(arr);
    expect(clone).toEqual(arr);
    expect(clone).not.toBe(arr);
    expect(clone[2]).not.toBe(arr[2]);
  });

  it('should handle empty objects and arrays', () => {
    expect(deepClone({})).toEqual({});
    expect(deepClone([])).toEqual([]);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs in UUID format', () => {
    const id = generateId();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });

  it('should generate IDs with version 4 marker', () => {
    const id = generateId();
    expect(id[14]).toBe('4');
  });
});

describe('nowISO', () => {
  it('should return ISO format date string', () => {
    const result = nowISO();
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
    expect(result).toMatch(isoRegex);
  });

  it('should return current time', () => {
    const before = new Date().toISOString();
    const result = nowISO();
    const after = new Date().toISOString();

    expect(result >= before).toBe(true);
    expect(result <= after).toBe(true);
  });
});
