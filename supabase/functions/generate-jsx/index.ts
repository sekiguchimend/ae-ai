// AE AI Extension - JSX Generation Edge Function
// Handles AI-powered JSX code generation for After Effects

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface GenerateRequest {
  provider: 'openai' | 'claude';
  characterContext: string;
  userPrompt: string;
  maxTokens?: number;
}

const AE_EXPERT_SYSTEM_PROMPT = `あなたはAdobe After Effectsのエキスパートです。
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

async function callOpenAI(prompt: string, systemPrompt: string, maxTokens: number) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage,
  };
}

async function callClaude(prompt: string, systemPrompt: string, maxTokens: number) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens,
    },
  };
}

function extractCodeBlock(response: string): string | null {
  const codeBlockRegex = /```(?:javascript|jsx|js)?\s*([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);
  return match && match[1] ? match[1].trim() : null;
}

function validateJSXSecurity(code: string): { isValid: boolean; issues: string[] } {
  const dangerousCommands = [
    'system.callSystem',
    'File.remove',
    'File.execute',
    'Folder.remove',
    '$.evalFile',
  ];

  const issues: string[] = [];
  for (const cmd of dangerousCommands) {
    if (code.includes(cmd)) {
      issues.push(`Dangerous command detected: ${cmd}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, characterContext, userPrompt, maxTokens = 2000 }: GenerateRequest = await req.json();

    const fullPrompt = `${characterContext}\n\n## リクエスト\n${userPrompt}\n\n上記のキャラクター構造と制約条件を考慮して、After Effects ExtendScriptコードを生成してください。`;

    let result;
    if (provider === 'claude') {
      result = await callClaude(fullPrompt, AE_EXPERT_SYSTEM_PROMPT, maxTokens);
    } else {
      result = await callOpenAI(fullPrompt, AE_EXPERT_SYSTEM_PROMPT, maxTokens);
    }

    // Extract code block
    const code = extractCodeBlock(result.content);
    if (!code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No code block found in AI response',
          rawResponse: result.content,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Security validation
    const security = validateJSXSecurity(code);
    if (!security.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Security validation failed',
          issues: security.issues,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        code,
        usage: result.usage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
