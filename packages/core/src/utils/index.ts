// ============================================
// Core Utilities
// ============================================

/**
 * JSXコードからコメントを削除して圧縮する
 * (非機能要件: JSX実行効率)
 */
export function compressJSX(code: string): string {
  return code
    // 複数行コメントを削除
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // 単一行コメントを削除
    .replace(/\/\/.*$/gm, '')
    // 連続する空白を1つに
    .replace(/\s+/g, ' ')
    // 行頭・行末の空白を削除
    .trim();
}

/**
 * AIレスポンスからJSXコードブロックを抽出する
 * (F-3: JSXコード生成・最適化)
 */
export function extractCodeBlock(response: string): string | null {
  // ```javascript または ```jsx ブロックを検出
  const codeBlockRegex = /```(?:javascript|jsx|js)?\s*([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/**
 * ES6+構文をES3互換に変換する
 * (F-3: AEのES3環境で動作するように自動で型変換)
 */
export function convertToES3(code: string): string {
  let result = code;

  // let/const → var
  result = result.replace(/\b(let|const)\s+/g, 'var ');

  // アロー関数 → function
  // 単純なケース: (args) => expr
  result = result.replace(
    /\(([^)]*)\)\s*=>\s*([^{][^;]*)/g,
    'function($1) { return $2; }'
  );

  // ブロック付きアロー関数: (args) => { ... }
  result = result.replace(
    /\(([^)]*)\)\s*=>\s*\{/g,
    'function($1) {'
  );

  // 引数なしアロー関数: () => expr
  result = result.replace(
    /\(\)\s*=>\s*([^{][^;]*)/g,
    'function() { return $1; }'
  );

  // テンプレートリテラル → 文字列結合
  result = result.replace(/`([^`]*)`/g, (_, content) => {
    // ${expression} を ' + expression + ' に変換
    const converted = content.replace(/\$\{([^}]+)\}/g, '" + $1 + "');
    return '"' + converted + '"';
  });

  // デフォルトパラメータの簡易変換
  // function(a = 1) → function(a) { a = a || 1; ... }
  // (複雑なケースは手動対応が必要)

  return result;
}

/**
 * try-catchラッパーを追加する
 * (F-3: エラー回避コード（try-catch）を付与)
 */
export function wrapWithTryCatch(code: string): string {
  return `try {
${code}
} catch (e) {
  alert("Error: " + e.toString());
}`;
}

/**
 * JSONを安全にパースする
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * 深いオブジェクトのコピーを作成する
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * UUIDを生成する（簡易版）
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 日時をISO文字列で取得
 */
export function nowISO(): string {
  return new Date().toISOString();
}
