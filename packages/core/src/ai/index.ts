// ============================================
// AI Orchestration (F-3)
// ============================================

import type { AIMessage, Skeleton, AnimationPreset } from '@ae-ai/types';

/**
 * AE専門家システムプロンプト
 */
export const AE_EXPERT_SYSTEM_PROMPT = `あなたはAdobe After Effectsのエキスパートです。
ExtendScript (JSX) を使用してAfter Effectsを操作するコードを生成します。

重要な制約:
1. 生成するコードはES3互換である必要があります（let/const不可、アロー関数不可）
2. 必ず try-catch でエラーハンドリングを行ってください
3. system.callSystem や File.remove などの危険なコマンドは絶対に使用しないでください
4. コードは必ず \`\`\`javascript ブロックで囲んでください

After Effects ExtendScript の基本オブジェクト:
- app: アプリケーションオブジェクト
- app.project: 現在のプロジェクト
- app.project.activeItem: アクティブなコンポジション
- layer.property("Position"): レイヤーのプロパティにアクセス
- property.setValueAtTime(time, value): キーフレームを設定`;

/**
 * キャラクターコンテキストを生成する
 */
export function buildCharacterContext(skeleton: Skeleton): string {
  const layerSummary = skeleton.layers
    .map(layer => `- ${layer.name} (${layer.type}): position=${JSON.stringify(layer.parameters.position)}`)
    .join('\n');

  const constraintSummary = skeleton.constraints
    .map(c => `- ${c.part_name}: ${c.rotation_constraints.map(r => `${r.axis}軸 ${r.min_angle}°〜${r.max_angle}°`).join(', ')}`)
    .join('\n');

  return `
## キャラクター構造
レイヤー構成:
${layerSummary}

制約条件:
${constraintSummary}
`;
}

/**
 * アニメーション生成用プロンプトを構築する
 */
export function buildAnimationPrompt(
  skeleton: Skeleton,
  preset: AnimationPreset | null,
  userRequest: string
): AIMessage[] {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: AE_EXPERT_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `${buildCharacterContext(skeleton)}

${preset ? `## 参考アニメーションプリセット
名前: ${preset.name}
カテゴリ: ${preset.category}
デュレーション: ${preset.duration}フレーム
` : ''}

## リクエスト
${userRequest}

上記のキャラクター構造と制約条件を考慮して、After Effects ExtendScriptコードを生成してください。`,
    },
  ];

  return messages;
}

/**
 * レイヤー解析リクエスト用プロンプトを構築する
 */
export function buildLayerAnalysisPrompt(layerInfo: string): AIMessage[] {
  return [
    {
      role: 'system',
      content: `あなたはAfter Effectsのレイヤー構造を分析するエキスパートです。
与えられたレイヤー情報から、キャラクターの骨格構造を推測し、最適な制約条件を提案してください。

出力形式:
\`\`\`json
{
  "suggested_constraints": [
    {
      "part_name": "部位名",
      "rotation_constraints": [
        { "axis": "z", "min_angle": -45, "max_angle": 45 }
      ],
      "recommended_easing": { "type": "ease-in-out" }
    }
  ]
}
\`\`\``,
    },
    {
      role: 'user',
      content: `以下のレイヤー構造を分析し、推奨される制約条件を提案してください:\n\n${layerInfo}`,
    },
  ];
}

/**
 * トークン数を概算する（簡易計算）
 */
export function estimateTokenCount(text: string): number {
  // 英語: ~4文字 = 1トークン
  // 日本語: ~1.5文字 = 1トークン
  const englishChars = text.replace(/[^\x00-\x7F]/g, '').length;
  const japaneseChars = text.length - englishChars;

  return Math.ceil(englishChars / 4 + japaneseChars / 1.5);
}

/**
 * コンテキストが最大トークン数を超えないようにトリムする
 */
export function trimContextToFit(
  context: string,
  maxTokens: number
): string {
  const currentTokens = estimateTokenCount(context);

  if (currentTokens <= maxTokens) {
    return context;
  }

  // 簡易的に文字数で削減
  const ratio = maxTokens / currentTokens;
  const targetLength = Math.floor(context.length * ratio * 0.9); // 10%マージン

  return context.slice(0, targetLength) + '\n... (truncated)';
}
