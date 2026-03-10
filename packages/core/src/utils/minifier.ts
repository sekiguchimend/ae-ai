/**
 * JSX Code Minifier for ExtendScript
 * Minimizes code size for faster AE injection
 */

export interface MinifyOptions {
  removeComments: boolean;
  removeWhitespace: boolean;
  shortenVariables: boolean;
  removeConsoleLog: boolean;
}

const DEFAULT_OPTIONS: MinifyOptions = {
  removeComments: true,
  removeWhitespace: true,
  shortenVariables: false, // Risky - disabled by default
  removeConsoleLog: true,
};

/**
 * Minify ExtendScript code
 */
export function minifyJSX(code: string, options: Partial<MinifyOptions> = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result = code;

  if (opts.removeComments) {
    result = removeComments(result);
  }

  if (opts.removeConsoleLog) {
    result = removeConsoleLogs(result);
  }

  if (opts.removeWhitespace) {
    result = compactWhitespace(result);
  }

  return result;
}

/**
 * Remove all comments
 */
function removeComments(code: string): string {
  // Remove single-line comments (but not in strings)
  let result = '';
  let inString = false;
  let stringChar = '';
  let inComment = false;
  let inBlockComment = false;
  let i = 0;

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];

    // Handle strings
    if (!inComment && !inBlockComment && (char === '"' || char === "'")) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && code[i - 1] !== '\\') {
        inString = false;
      }
      result += char;
      i++;
      continue;
    }

    // Handle block comments
    if (!inString && !inComment && char === '/' && nextChar === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (inBlockComment && char === '*' && nextChar === '/') {
      inBlockComment = false;
      i += 2;
      continue;
    }

    // Handle single-line comments
    if (!inString && !inBlockComment && char === '/' && nextChar === '/') {
      inComment = true;
      i += 2;
      continue;
    }

    if (inComment && char === '\n') {
      inComment = false;
      result += '\n';
      i++;
      continue;
    }

    // Add character if not in comment
    if (!inComment && !inBlockComment) {
      result += char;
    }

    i++;
  }

  return result;
}

/**
 * Remove console.log statements
 */
function removeConsoleLogs(code: string): string {
  // Remove $.writeln and alert for debugging
  let result = code;

  // Remove $.writeln calls
  result = result.replace(/\$\.writeln\s*\([^)]*\)\s*;?/g, '');

  // Remove alert calls (careful - might be intentional)
  // result = result.replace(/alert\s*\([^)]*\)\s*;?/g, '');

  return result;
}

/**
 * Compact whitespace while preserving code structure
 */
function compactWhitespace(code: string): string {
  let result = '';
  let inString = false;
  let stringChar = '';
  let lastChar = '';
  let lastNonWhitespace = '';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];

    // Handle strings - preserve exactly
    if (char === '"' || char === "'") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && code[i - 1] !== '\\') {
        inString = false;
      }
      result += char;
      lastChar = char;
      lastNonWhitespace = char;
      continue;
    }

    if (inString) {
      result += char;
      lastChar = char;
      continue;
    }

    // Handle whitespace outside strings
    if (/\s/.test(char)) {
      // Keep newlines for statement separation
      if (char === '\n') {
        // Don't add multiple newlines
        if (lastChar !== '\n') {
          result += '\n';
          lastChar = '\n';
        }
      } else if (!/\s/.test(lastChar)) {
        // Keep single space between tokens if needed
        const needsSpace = needsSpaceBetween(lastNonWhitespace, peekNextNonWhitespace(code, i));
        if (needsSpace) {
          result += ' ';
          lastChar = ' ';
        }
      }
      continue;
    }

    result += char;
    lastChar = char;
    lastNonWhitespace = char;
  }

  // Clean up extra newlines
  result = result.replace(/\n{2,}/g, '\n');

  return result.trim();
}

/**
 * Check if space is needed between two characters
 */
function needsSpaceBetween(prev: string, next: string): boolean {
  if (!prev || !next) return false;

  // Keywords and identifiers need space between
  const isAlphanumeric = (c: string) => /[a-zA-Z0-9_$]/.test(c);

  if (isAlphanumeric(prev) && isAlphanumeric(next)) {
    return true;
  }

  // Some operators need space
  const operatorPairs = [
    ['return', /[a-zA-Z0-9_$"'(\[{]/],
    ['var', /[a-zA-Z_$]/],
    ['function', /[a-zA-Z_$(]/],
    ['if', '('],
    ['else', /[{a-zA-Z]/],
    ['for', '('],
    ['while', '('],
    ['in', /[a-zA-Z_$]/],
  ];

  return false;
}

/**
 * Peek next non-whitespace character
 */
function peekNextNonWhitespace(code: string, startIndex: number): string {
  for (let i = startIndex + 1; i < code.length; i++) {
    if (!/\s/.test(code[i])) {
      return code[i];
    }
  }
  return '';
}

/**
 * Calculate compression ratio
 */
export function getCompressionStats(original: string, minified: string): {
  originalSize: number;
  minifiedSize: number;
  savedBytes: number;
  compressionRatio: number;
} {
  const originalSize = original.length;
  const minifiedSize = minified.length;
  const savedBytes = originalSize - minifiedSize;
  const compressionRatio = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;

  return {
    originalSize,
    minifiedSize,
    savedBytes,
    compressionRatio: Math.round(compressionRatio * 100) / 100,
  };
}
