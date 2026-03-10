/**
 * Unit Tests for JSX Syntax Validator
 */

import { validateJSXSyntax, formatValidationResult } from '../validation/jsx-syntax';

describe('validateJSXSyntax', () => {
  describe('balanced brackets', () => {
    it('should pass code with balanced brackets', () => {
      const code = `
        function test() {
          var arr = [1, 2, 3];
          if (arr.length > 0) {
            alert(arr[0]);
          }
        }
      `;
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(true);
    });

    it('should detect unclosed parenthesis', () => {
      const code = 'function test( { return 1; }';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Unclosed'))).toBe(true);
    });

    it('should detect unclosed brace', () => {
      const code = 'function test() { var x = 1;';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Unclosed'))).toBe(true);
    });

    it('should detect unmatched closing bracket', () => {
      const code = 'var x = 1; }';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Unmatched'))).toBe(true);
    });

    it('should detect mismatched brackets', () => {
      const code = 'function test() { var arr = [1, 2]; }';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(true);
    });
  });

  describe('ES3 compatibility', () => {
    it('should detect let keyword', () => {
      const code = 'let x = 1;';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("'let'"))).toBe(true);
    });

    it('should detect const keyword', () => {
      const code = 'const y = 2;';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("'const'"))).toBe(true);
    });

    it('should detect arrow functions', () => {
      const code = 'var fn = () => 1;';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Arrow functions'))).toBe(true);
    });

    it('should detect template literals', () => {
      const code = 'var str = `Hello ${name}`;';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Template literals'))).toBe(true);
    });

    it('should detect class keyword', () => {
      const code = 'class MyClass {}';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("'class'"))).toBe(true);
    });

    it('should detect import statement', () => {
      const code = "import x from 'module';";
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("'import'"))).toBe(true);
    });

    it('should detect export statement', () => {
      const code = 'export var x = 1;';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("'export'"))).toBe(true);
    });

    it('should detect spread operator', () => {
      const code = 'var arr = [...items];';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Spread operator'))).toBe(true);
    });

    it('should detect async/await', () => {
      const code = 'async function test() { await fetch(); }';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('async/await'))).toBe(true);
    });

    it('should detect for...of loops', () => {
      const code = 'for (var item of items) {}';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('for...of'))).toBe(true);
    });

    it('should detect Promise usage', () => {
      const code = 'var p = new Promise(function(){});';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Promise'))).toBe(true);
    });

    it('should pass valid ES3 code', () => {
      const code = `
        var x = 1;
        function test(a, b) {
          for (var i = 0; i < 10; i++) {
            if (a[i] === b) {
              return i;
            }
          }
          return -1;
        }
      `;
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(true);
    });
  });

  describe('common syntax errors', () => {
    it('should detect assignment in condition', () => {
      const code = 'if (x = 1) { alert(x); }';
      const result = validateJSXSyntax(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('assignment in condition'))).toBe(true);
    });

    it('should not flag equality comparison', () => {
      const code = 'if (x == 1) { alert(x); }';
      const result = validateJSXSyntax(code);
      expect(result.errors.some((e) => e.message.includes('assignment in condition'))).toBe(false);
    });

    it('should not flag strict equality', () => {
      const code = 'if (x === 1) { alert(x); }';
      const result = validateJSXSyntax(code);
      expect(result.errors.some((e) => e.message.includes('assignment in condition'))).toBe(false);
    });
  });

  describe('warnings', () => {
    it('should warn about eval usage', () => {
      const code = 'eval("var x = 1;");';
      const result = validateJSXSyntax(code);
      expect(result.warnings.some((w) => w.message.includes('eval'))).toBe(true);
    });

    it('should warn about very long lines', () => {
      const code = 'var x = "' + 'a'.repeat(200) + '";';
      const result = validateJSXSyntax(code);
      expect(result.warnings.some((w) => w.message.includes('long'))).toBe(true);
    });

    it('should warn about undeclared loop variables', () => {
      const code = 'for (i = 0; i < 10; i++) {}';
      const result = validateJSXSyntax(code);
      expect(result.warnings.some((w) => w.message.includes('should be declared'))).toBe(true);
    });

    it('should not warn for declared loop variables', () => {
      const code = 'for (var i = 0; i < 10; i++) {}';
      const result = validateJSXSyntax(code);
      expect(result.warnings.some((w) => w.message.includes('should be declared'))).toBe(false);
    });
  });
});

describe('formatValidationResult', () => {
  it('should format valid result', () => {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
    };
    const formatted = formatValidationResult(result);
    expect(formatted).toContain('No errors or warnings');
  });

  it('should format errors', () => {
    const result = {
      isValid: false,
      errors: [
        { type: 'syntax' as const, message: 'Test error', line: 5 },
      ],
      warnings: [],
    };
    const formatted = formatValidationResult(result);
    expect(formatted).toContain('Errors (1)');
    expect(formatted).toContain('Test error');
    expect(formatted).toContain('line 5');
  });

  it('should format warnings', () => {
    const result = {
      isValid: true,
      errors: [],
      warnings: [
        { type: 'style' as const, message: 'Test warning', line: 10 },
      ],
    };
    const formatted = formatValidationResult(result);
    expect(formatted).toContain('Warnings (1)');
    expect(formatted).toContain('Test warning');
    expect(formatted).toContain('line 10');
  });

  it('should format both errors and warnings', () => {
    const result = {
      isValid: false,
      errors: [
        { type: 'compatibility' as const, message: 'Error 1' },
      ],
      warnings: [
        { type: 'performance' as const, message: 'Warning 1' },
      ],
    };
    const formatted = formatValidationResult(result);
    expect(formatted).toContain('Errors');
    expect(formatted).toContain('Warnings');
    expect(formatted).toContain('Error 1');
    expect(formatted).toContain('Warning 1');
  });
});
