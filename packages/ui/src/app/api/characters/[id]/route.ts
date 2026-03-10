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

// GET /api/characters/[id] - 特定キャラクター取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();

    if (!supabase) {
      // Mock response
      return NextResponse.json({
        success: true,
        data: {
          id,
          name: 'テストキャラクター',
          description: 'テスト用キャラクター',
          layer_mapping: {
            head: 'Head_Layer',
            body: 'Body_Layer',
            arm_r: 'Arm_R_Layer',
            arm_l: 'Arm_L_Layer',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        mock: true,
      });
    }

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
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

// PUT /api/characters/[id] - キャラクター更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, layer_mapping } = body;

    const supabase = getSupabaseClient();

    if (!supabase) {
      // Mock response
      return NextResponse.json({
        success: true,
        data: {
          id,
          name: name || 'Updated Character',
          description: description || null,
          layer_mapping: layer_mapping || {},
          updated_at: new Date().toISOString(),
        },
        mock: true,
      });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (layer_mapping !== undefined) updateData.layer_mapping = layer_mapping;

    const { data, error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

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

// DELETE /api/characters/[id] - キャラクター削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = getSupabaseClient();

    if (!supabase) {
      // Mock response
      return NextResponse.json({
        success: true,
        message: `Character ${id} deleted`,
        mock: true,
      });
    }

    const { error } = await supabase.from('characters').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
