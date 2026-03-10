/**
 * JSX Syntax Validator
 * Validates ExtendScript code for common syntax errors
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'syntax' | 'security' | 'compatibility';
  message: string;
  line?: number;
  column?: number;
}

export interface ValidationWarning {
  type: 'deprecation' | 'performance' | 'style';
  message: string;
  line?: number;
}

/**
 * Validate ExtendScript syntax
 */
export function validateJSXSyntax(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check for balanced brackets
  const bracketErrors = checkBalancedBrackets(code);
  errors.push(...bracketErrors);

  // Check for ES6+ syntax that ExtendScript doesn't support
  const compatibilityErrors = checkES3Compatibility(code);
  errors.push(...compatibilityErrors);

  // Check for common syntax errors
  const syntaxErrors = checkCommonSyntaxErrors(code);
  errors.push(...syntaxErrors);

  // Check for potential issues
  const potentialWarnings = checkPotentialIssues(code);
  warnings.push(...potentialWarnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for balanced brackets and parentheses
 */
function checkBalancedBrackets(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const stack: { char: string; line: number; col: number }[] = [];
  const pairs: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  };
  const closers: Record<string, string> = {
    ')': '(',
    ']': '[',
    '}': '{',
  };

  // Remove strings and comments to avoid false positives
  const cleanedCode = removeStringsAndComments(code);

  let line = 1;
  let col = 0;

  for (let i = 0; i < cleanedCode.length; i++) {
    const char = cleanedCode[i];

    if (char === '\n') {
      line++;
      col = 0;
      continue;
    }

    col++;

    if (pairs[char]) {
      stack.push({ char, line, col });
    } else if (closers[char]) {
      const last = stack.pop();
      if (!last) {
        errors.push({
          type: 'syntax',
          message: `Unmatched closing '${char}'`,
          line,
          column: col,
        });
      } else if (pairs[last.char] !== char) {
        errors.push({
          type: 'syntax',
          message: `Mismatched brackets: expected '${pairs[last.char]}' but found '${char}'`,
          line,
          column: col,
        });
      }
    }
  }

  // Check for unclosed brackets
  for (const unclosed of stack) {
    errors.push({
      type: 'syntax',
      message: `Unclosed '${unclosed.char}'`,
      line: unclosed.line,
      column: unclosed.col,
    });
  }

  return errors;
}

/**
 * Check for ES6+ syntax that ExtendScript doesn't support
 */
function checkES3Compatibility(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  const patterns: { pattern: RegExp; message: string }[] = [
    { pattern: /\blet\s+/, message: "'let' is not supported in ExtendScript. Use 'var' instead." },
    { pattern: /\bconst\s+/, message: "'const' is not supported in ExtendScript. Use 'var' instead." },
    { pattern: /=>/, message: "Arrow functions are not supported in ExtendScript. Use 'function' instead." },
    { pattern: /`[^`]*`/, message: "Template literals are not supported in ExtendScript. Use string concatenation instead." },
    { pattern: /\bclass\s+/, message: "'class' is not supported in ExtendScript. Use function constructors instead." },
    { pattern: /\bimport\s+/, message: "'import' is not supported in ExtendScript." },
    { pattern: /\bexport\s+/, message: "'export' is not supported in ExtendScript." },
    { pattern: /\.\.\.[a-zA-Z]/, message: "Spread operator is not supported in ExtendScript." },
    { pattern: /\basync\s+/, message: "'async/await' is not supported in ExtendScript." },
    { pattern: /\bawait\s+/, message: "'async/await' is not supported in ExtendScript." },
    { pattern: /\bfor\s*\(\s*(?:let|const|var)\s+\w+\s+of\b/, message: "'for...of' loops are not supported in ExtendScript. Use traditional for loops." },
    { pattern: /\bSymbol\s*\(/, message: "Symbols are not supported in ExtendScript." },
    { pattern: /\bPromise\s*[.(]/, message: "Promises are not supported in ExtendScript." },
    { pattern: /\bMap\s*\(/, message: "Map is not supported in ExtendScript." },
    { pattern: /\bSet\s*\(/, message: "Set is not supported in ExtendScript." },
    { pattern: /\bWeakMap\s*\(/, message: "WeakMap is not supported in ExtendScript." },
    { pattern: /\bWeakSet\s*\(/, message: "WeakSet is not supported in ExtendScript." },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip comments
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      continue;
    }

    for (const { pattern, message } of patterns) {
      if (pattern.test(line)) {
        errors.push({
          type: 'compatibility',
          message,
          line: lineNumber,
        });
      }
    }
  }

  return errors;
}

/**
 * Check for common syntax errors
 */
function checkCommonSyntaxErrors(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip comments
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      continue;
    }

    // Check for missing semicolons (basic check)
    if (
      trimmedLine.length > 0 &&
      !trimmedLine.endsWith(';') &&
      !trimmedLine.endsWith('{') &&
      !trimmedLine.endsWith('}') &&
      !trimmedLine.endsWith(',') &&
      !trimmedLine.endsWith('(') &&
      !trimmedLine.endsWith(':') &&
      !trimmedLine.startsWith('if') &&
      !trimmedLine.startsWith('else') &&
      !trimmedLine.startsWith('for') &&
      !trimmedLine.startsWith('while') &&
      !trimmedLine.startsWith('function') &&
      !trimmedLine.startsWith('//') &&
      !trimmedLine.startsWith('*') &&
      trimmedLine !== ''
    ) {
      // This is a loose check - could be a false positive
      // Just add as warning instead of error
    }

    // Check for = vs == in conditions
    const ifMatch = line.match(/if\s*\(\s*[^=!<>]*=(?!=)/);
    if (ifMatch && !line.includes('==') && !line.includes('===')) {
      errors.push({
        type: 'syntax',
        message: "Possible assignment in condition. Did you mean '==' or '==='?",
        line: lineNumber,
      });
    }
  }

  return errors;
}

/**
 * Check for potential issues and warnings
 */
function checkPotentialIssues(code: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Check for eval usage
    if (/\beval\s*\(/.test(line)) {
      warnings.push({
        type: 'performance',
        message: "Avoid using 'eval()' when possible",
        line: lineNumber,
      });
    }

    // Check for deeply nested code
    const indentLevel = line.match(/^\s*/)?.[0].length || 0;
    if (indentLevel > 20) {
      warnings.push({
        type: 'style',
        message: 'Deeply nested code may be hard to maintain',
        line: lineNumber,
      });
    }

    // Check for very long lines
    if (line.length > 200) {
      warnings.push({
        type: 'style',
        message: 'Line is very long. Consider breaking it up.',
        line: lineNumber,
      });
    }

    // Check for undeclared loop variables
    const forMatch = line.match(/for\s*\(\s*(\w+)\s*=/);
    if (forMatch && !line.includes('var ')) {
      warnings.push({
        type: 'style',
        message: `Loop variable '${forMatch[1]}' should be declared with 'var'`,
        line: lineNumber,
      });
    }
  }

  return warnings;
}

/**
 * Remove strings and comments from code for bracket checking
 */
function removeStringsAndComments(code: string): string {
  // Remove single-line comments
  let result = code.replace(/\/\/[^\n]*/g, '');

  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // Remove double-quoted strings
  result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');

  // Remove single-quoted strings
  result = result.replace(/'(?:[^'\\]|\\.)*'/g, "''");

  return result;
}

/**
 * Format validation result as string
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'Validation passed: No errors or warnings';
  }

  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push(`Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      const location = error.line ? ` (line ${error.line})` : '';
      lines.push(`  - [${error.type}]${location}: ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) {
      const location = warning.line ? ` (line ${warning.line})` : '';
      lines.push(`  - [${warning.type}]${location}: ${warning.message}`);
    }
  }

  return lines.join('\n');
}
