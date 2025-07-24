import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

// 获取案例列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const authorId = searchParams.get('authorId')

    const offset = (page - 1) * limit

    let query = supabaseAuth
      .from('cases')
      .select(`
        *,
        profiles:author_id (
          username,
          display_name,
          avatar_url
        ),
        categories (
          id,
          name_zh
        )
      `)
      .eq('status', 'published')

    if (category && category !== '全部') {
      query = query.eq('categories.name_zh', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (authorId) {
      query = query.eq('author_id', authorId)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取案例列表错误:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('获取案例列表异常:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 其他 HTTP 方法的实现...
export async function POST(_request: NextRequest) {
  // 创建案例的逻辑
  return NextResponse.json({ message: 'POST method not implemented yet' }, { status: 501 })
} 