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

// GET /api/characters - キャラクター一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // Mock response for testing without Supabase
      return NextResponse.json({
        success: true,
        data: [
          {
            id: 'mock-1',
            name: 'テストキャラクター1',
            description: 'テスト用キャラクター',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-2',
            name: 'テストキャラクター2',
            description: 'テスト用キャラクター2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        mock: true,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
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

// POST /api/characters - キャラクター作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, layer_mapping } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      // Mock response for testing
      return NextResponse.json({
        success: true,
        data: {
          id: `mock-${Date.now()}`,
          name,
          description: description || null,
          layer_mapping: layer_mapping || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        mock: true,
      });
    }

    const { data, error } = await supabase
      .from('characters')
      .insert({
        name,
        description,
        layer_mapping: layer_mapping || {},
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
