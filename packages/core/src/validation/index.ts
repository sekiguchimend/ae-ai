// ============================================
// Validation & Security (非機能要件: コードインジェクション対策)
// ============================================

/**
 * 危険なJSXコマンドのリスト
 */
const DANGEROUS_COMMANDS = [
  'system.callSystem',
  'File.remove',
  'File.execute',
  'Folder.remove',
  'app.exitAfterLaunchAndEval',
  '$.evalFile',
  'eval(',
  'Function(',
  'setTimeout(',
  'setInterval(',
];

/**
 * JSXコードに危険なコマンドが含まれていないか検証する
 */
export function validateJSXSecurity(code: string): {
  isValid: boolean;
  detectedCommands: string[];
} {
  const detectedCommands: string[] = [];

  for (const command of DANGEROUS_COMMANDS) {
    if (code.includes(command)) {
      detectedCommands.push(command);
    }
  }

  return {
    isValid: detectedCommands.length === 0,
    detectedCommands,
  };
}

/**
 * JSXコードから危険なコマンドを削除（サニタイズ）する
 */
export function sanitizeJSX(code: string): string {
  let sanitized = code;

  for (const command of DANGEROUS_COMMANDS) {
    // コマンドをコメントアウトして無効化
    const regex = new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    sanitized = sanitized.replace(regex, `/* BLOCKED: ${command} */`);
  }

  return sanitized;
}

/**
 * レイヤー名のバリデーション
 */
export function validateLayerName(name: string): boolean {
  // 空文字列は不可
  if (!name || name.trim().length === 0) {
    return false;
  }

  // 長すぎる名前は不可（AEの制限）
  if (name.length > 255) {
    return false;
  }

  return true;
}

/**
 * 角度の範囲バリデーション
 */
export function validateAngleRange(min: number, max: number): boolean {
  // 最小値が最大値より大きい場合は不正
  if (min > max) {
    return false;
  }

  // -360 から 360 の範囲内
  if (min < -360 || max > 360) {
    return false;
  }

  return true;
}

/**
 * 不透明度のバリデーション (0-100)
 */
export function validateOpacity(value: number): boolean {
  return value >= 0 && value <= 100;
}

/**
 * スケール値のバリデーション (0以上)
 */
export function validateScale(value: number): boolean {
  return value >= 0;
}

/**
 * キャラクター名のバリデーション
 */
export function validateCharacterName(name: string): {
  isValid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'キャラクター名は必須です' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'キャラクター名は100文字以内にしてください' };
  }

  // 特殊文字のチェック
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { isValid: false, error: '使用できない文字が含まれています' };
  }

  return { isValid: true };
}

/**
 * Eメールのバリデーション
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
