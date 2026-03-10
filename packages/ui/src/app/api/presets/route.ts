import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// GET /api/presets - プリセット一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const characterId = searchParams.get('character_id');

    if (!supabase) {
      // Mock response
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'preset-1',
            name: '手を振る',
            category: 'gesture',
            description: '基本的な挨拶アニメーション',
            jsx_code: 'var layer = comp.layer(1); layer.transform.rotation.setValueAtTime(0, 0);',
            parameters: { duration: 2.0, loop: true },
            is_global: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'preset-2',
            name: '歩く',
            category: 'locomotion',
            description: '歩行アニメーション',
            jsx_code: 'var layer = comp.layer(1); // walk animation',
            parameters: { speed: 1.0 },
            is_global: true,
            created_at: new Date().toISOString(),
          },
        ],
        mock: true,
      });
    }

    let query = supabase
      .from('animation_presets')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (characterId) {
      query = query.eq('character_id', characterId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/presets - プリセット作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, description, jsx_code, parameters, is_global, character_id } = body;

    if (!name || !jsx_code) {
      return NextResponse.json(
        { success: false, error: 'Name and jsx_code are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      // Mock response
      return NextResponse.json({
        success: true,
        data: {
          id: `preset-${Date.now()}`,
          name,
          category: category || 'general',
          description: description || null,
          jsx_code,
          parameters: parameters || {},
          is_global: is_global ?? false,
          character_id: character_id || null,
          created_at: new Date().toISOString(),
        },
        mock: true,
      });
    }

    const { data, error } = await supabase
      .from('animation_presets')
      .insert({
        name,
        category: category || 'general',
        description,
        jsx_code,
        parameters: parameters || {},
        is_global: is_global ?? false,
        character_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
