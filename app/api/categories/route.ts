import { NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

// 获取分类列表
export async function GET() {
  try {
    const { data, error } = await supabaseAuth
      .from('categories')
      .select('name_zh')
      .order('created_at')

    if (error) {
      console.error('获取分类列表错误:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('获取分类列表异常:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 