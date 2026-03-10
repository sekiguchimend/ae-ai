/**
 * Unit Tests for JSX Minifier
 */

import { minifyJSX, getCompressionStats } from '../utils/minifier';

describe('minifyJSX', () => {
  describe('comment removal', () => {
    it('should remove single-line comments', () => {
      const code = `var x = 1; // this is a comment
var y = 2;`;
      const result = minifyJSX(code);
      expect(result).not.toContain('this is a comment');
      expect(result).toContain('var x = 1');
      expect(result).toContain('var y = 2');
    });

    it('should remove multi-line comments', () => {
      const code = `var x = 1;
/* this is a
multi-line comment */
var y = 2;`;
      const result = minifyJSX(code);
      expect(result).not.toContain('multi-line');
      expect(result).toContain('var x = 1');
      expect(result).toContain('var y = 2');
    });

    it('should preserve comment-like content in strings', () => {
      const code = 'var str = "// not a comment";';
      const result = minifyJSX(code);
      expect(result).toContain('"// not a comment"');
    });

    it('should handle multiple comments', () => {
      const code = `// comment 1
var x = 1; // comment 2
/* block */ var y = 2;`;
      const result = minifyJSX(code);
      expect(result).not.toContain('comment 1');
      expect(result).not.toContain('comment 2');
      expect(result).not.toContain('block');
    });
  });

  describe('console log removal', () => {
    it('should remove $.writeln statements', () => {
      const code = '$.writeln("debug"); var x = 1;';
      const result = minifyJSX(code);
      expect(result).not.toContain('$.writeln');
      expect(result).toContain('var x = 1');
    });

    it('should remove $.writeln with complex arguments', () => {
      const code = '$.writeln("Value: " + x + ", " + y); var z = 3;';
      const result = minifyJSX(code);
      expect(result).not.toContain('$.writeln');
      expect(result).toContain('var z = 3');
    });
  });

  describe('whitespace compaction', () => {
    it('should compact multiple spaces', () => {
      const code = 'var x    =    1;';
      const result = minifyJSX(code);
      expect(result).not.toContain('    ');
    });

    it('should preserve space between keywords and identifiers', () => {
      const code = 'var x = 1; function test() { return x; }';
      const result = minifyJSX(code);
      expect(result).toContain('var');
      expect(result).toContain('function');
      expect(result).toContain('return');
    });

    it('should handle empty lines', () => {
      const code = `var x = 1;

var y = 2;`;
      const result = minifyJSX(code);
      expect(result).not.toMatch(/\n{2,}/);
    });

    it('should trim leading and trailing whitespace', () => {
      const code = '   var x = 1;   ';
      const result = minifyJSX(code);
      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });

  describe('options', () => {
    it('should respect removeComments option', () => {
      const code = 'var x = 1; // comment';
      const result = minifyJSX(code, { removeComments: false });
      expect(result).toContain('comment');
    });

    it('should respect removeConsoleLog option', () => {
      const code = '$.writeln("test"); var x = 1;';
      const result = minifyJSX(code, { removeConsoleLog: false });
      expect(result).toContain('$.writeln');
    });

    it('should respect removeWhitespace option', () => {
      const code = 'var    x    =    1;';
      const result = minifyJSX(code, { removeWhitespace: false });
      expect(result).toContain('    ');
    });

    it('should apply all options by default', () => {
      const code = `// comment
$.writeln("test");
var    x    =    1;`;
      const result = minifyJSX(code);
      expect(result).not.toContain('comment');
      expect(result).not.toContain('$.writeln');
      expect(result).not.toContain('    ');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = minifyJSX('');
      expect(result).toBe('');
    });

    it('should handle code with only comments', () => {
      const code = '// only comment';
      const result = minifyJSX(code);
      expect(result).toBe('');
    });

    it('should handle code with nested strings', () => {
      const code = 'var str = "Hello \\"world\\"";';
      const result = minifyJSX(code);
      expect(result).toContain('Hello');
    });

    it('should handle single-quoted strings', () => {
      const code = "var str = 'Hello world';";
      const result = minifyJSX(code);
      expect(result).toContain("'Hello world'");
    });
  });
});

describe('getCompressionStats', () => {
  it('should calculate correct statistics', () => {
    const original = '// comment\nvar x = 1;    var y = 2;';
    const minified = 'var x = 1; var y = 2;';

    const stats = getCompressionStats(original, minified);

    expect(stats.originalSize).toBe(original.length);
    expect(stats.minifiedSize).toBe(minified.length);
    expect(stats.savedBytes).toBe(original.length - minified.length);
    expect(stats.compressionRatio).toBeGreaterThan(0);
  });

  it('should handle zero compression', () => {
    const code = 'var x = 1;';
    const stats = getCompressionStats(code, code);

    expect(stats.savedBytes).toBe(0);
    expect(stats.compressionRatio).toBe(0);
  });

  it('should handle empty input', () => {
    const stats = getCompressionStats('', '');

    expect(stats.originalSize).toBe(0);
    expect(stats.minifiedSize).toBe(0);
    expect(stats.compressionRatio).toBe(0);
  });

  it('should round compression ratio to 2 decimal places', () => {
    const original = 'abcdefghij'; // 10 chars
    const minified = 'abc'; // 3 chars (70% saved)

    const stats = getCompressionStats(original, minified);

    expect(stats.compressionRatio).toBe(70);
  });
});
