import { NextRequest, NextResponse } from 'next/server';

const DANGEROUS_COMMANDS = [
  'system.callSystem',
  'File.remove',
  'File.execute',
  'Folder.remove',
  'app.exitAfterLaunchAndEval',
  '$.evalFile',
  'eval(',
  'Function(',
];

const ES6_PATTERNS = [
  { pattern: /\blet\s+/, message: "'let' is not supported in ExtendScript" },
  { pattern: /\bconst\s+/, message: "'const' is not supported in ExtendScript" },
  { pattern: /=>/, message: 'Arrow functions are not supported in ExtendScript' },
  { pattern: /`[^`]*`/, message: 'Template literals are not supported in ExtendScript' },
  { pattern: /\bclass\s+/, message: "'class' is not supported in ExtendScript" },
  { pattern: /\basync\s+/, message: 'async/await is not supported in ExtendScript' },
  { pattern: /\bawait\s+/, message: 'async/await is not supported in ExtendScript' },
];

// POST /api/validate - JSXコードの検証
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Security check
    for (const cmd of DANGEROUS_COMMANDS) {
      if (code.includes(cmd)) {
        errors.push(`Security violation: ${cmd} is not allowed`);
      }
    }

    // ES3 compatibility check
    for (const { pattern, message } of ES6_PATTERNS) {
      if (pattern.test(code)) {
        errors.push(`Compatibility error: ${message}`);
      }
    }

    // Basic syntax checks
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Syntax error: Unbalanced braces');
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push('Syntax error: Unbalanced parentheses');
    }

    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push('Syntax error: Unbalanced brackets');
    }

    // Warning checks
    if (!code.includes('try')) {
      warnings.push('Recommendation: Consider wrapping code in try-catch');
    }

    if (code.includes('alert(')) {
      warnings.push('Note: alert() will show dialog in After Effects');
    }

    const isValid = errors.length === 0;

    return NextResponse.json({
      success: true,
      isValid,
      errors,
      warnings,
      stats: {
        lines: code.split('\n').length,
        characters: code.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
