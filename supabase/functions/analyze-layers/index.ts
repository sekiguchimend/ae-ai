// AE AI Extension - Layer Analysis Edge Function
// Analyzes layer structure and suggests constraints

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface AnalyzeRequest {
  provider: 'openai' | 'claude';
  layerData: string;
}

const ANALYSIS_SYSTEM_PROMPT = `あなたはAfter Effectsのレイヤー構造を分析するエキスパートです。
与えられたレイヤー情報から、キャラクターの骨格構造を推測し、最適な制約条件を提案してください。

出力形式（必ずJSON形式で出力）:
\`\`\`json
{
  "analysis": {
    "character_type": "人型/動物/オブジェクト等",
    "complexity": "simple/medium/complex",
    "recommended_rig_type": "IK/FK/hybrid"
  },
  "suggested_constraints": [
    {
      "part_name": "部位名",
      "layer_name": "対応するレイヤー名",
      "rotation_constraints": [
        { "axis": "z", "min_angle": -45, "max_angle": 45 }
      ],
      "recommended_easing": { "type": "ease-in-out" }
    }
  ],
  "warnings": ["注意事項があれば記載"]
}
\`\`\``;

async function callOpenAI(prompt: string, systemPrompt: string) {
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
      max_tokens: 2000,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callClaude(prompt: string, systemPrompt: string) {
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
      max_tokens: 2000,
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
  return data.content[0].text;
}

function extractJSON(text: string): object | null {
  // Try to extract JSON from code block
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  const jsonStr = match ? match[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, layerData }: AnalyzeRequest = await req.json();

    const prompt = `以下のAfter Effectsレイヤー構造を分析し、推奨される制約条件を提案してください:\n\n${layerData}`;

    let result;
    if (provider === 'claude') {
      result = await callClaude(prompt, ANALYSIS_SYSTEM_PROMPT);
    } else {
      result = await callOpenAI(prompt, ANALYSIS_SYSTEM_PROMPT);
    }

    const parsed = extractJSON(result);
    if (!parsed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse AI response as JSON',
          rawResponse: result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...parsed,
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
