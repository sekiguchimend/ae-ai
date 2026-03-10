import { NextRequest, NextResponse } from 'next/server';

// POST /api/generate - AIでJSXコード生成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, characterId, provider = 'openai' } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // If Supabase is configured, call the Edge Function
    if (supabaseUrl) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-jsx`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            provider,
            characterContext: characterId
              ? `キャラクターID: ${characterId}`
              : 'キャラクター情報なし',
            userPrompt: prompt,
          }),
        });

        const data = await response.json();
        return NextResponse.json(data);
      } catch (edgeFunctionError) {
        console.error('Edge Function error:', edgeFunctionError);
        // Fall through to mock response
      }
    }

    // Mock response for testing without Supabase/AI
    const mockCode = generateMockJSXCode(prompt);

    return NextResponse.json({
      success: true,
      code: mockCode,
      usage: {
        prompt_tokens: 150,
        completion_tokens: 200,
        total_tokens: 350,
      },
      mock: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

function generateMockJSXCode(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('手を振') || lowerPrompt.includes('wave')) {
    return `// 手を振るアニメーション
try {
  var comp = app.project.activeItem;
  var layer = comp.selectedLayers[0];
  var rotation = layer.property("Rotation");

  rotation.setValueAtTime(0, 0);
  rotation.setValueAtTime(0.5, 15);
  rotation.setValueAtTime(1, -15);
  rotation.setValueAtTime(1.5, 15);
  rotation.setValueAtTime(2, 0);
} catch (e) {
  alert("Error: " + e.toString());
}`;
  }

  if (lowerPrompt.includes('歩') || lowerPrompt.includes('walk')) {
    return `// 歩行アニメーション
try {
  var comp = app.project.activeItem;
  var layer = comp.selectedLayers[0];
  var position = layer.property("Position");
  var currentPos = position.value;

  position.setValueAtTime(0, currentPos);
  position.setValueAtTime(1, [currentPos[0] + 100, currentPos[1]]);
  position.setValueAtTime(2, [currentPos[0] + 200, currentPos[1]]);
} catch (e) {
  alert("Error: " + e.toString());
}`;
  }

  if (lowerPrompt.includes('ジャンプ') || lowerPrompt.includes('jump')) {
    return `// ジャンプアニメーション
try {
  var comp = app.project.activeItem;
  var layer = comp.selectedLayers[0];
  var position = layer.property("Position");
  var currentPos = position.value;

  position.setValueAtTime(0, currentPos);
  position.setValueAtTime(0.3, [currentPos[0], currentPos[1] - 100]);
  position.setValueAtTime(0.6, currentPos);
} catch (e) {
  alert("Error: " + e.toString());
}`;
  }

  // Default animation
  return `// カスタムアニメーション: ${prompt}
try {
  var comp = app.project.activeItem;
  var layer = comp.selectedLayers[0];

  if (!layer) {
    alert("レイヤーを選択してください");
  } else {
    var opacity = layer.property("Opacity");
    opacity.setValueAtTime(0, 100);
    opacity.setValueAtTime(1, 50);
    opacity.setValueAtTime(2, 100);
  }
} catch (e) {
  alert("Error: " + e.toString());
}`;
}
