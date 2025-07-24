import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

// 获取用户收藏列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const withDetails = searchParams.get('withDetails') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    if (withDetails) {
      // 获取收藏的案例详情
      const { data: favoriteCases, error } = await supabaseAuth
        .from('user_favorites')
        .select(`
          case_id,
          cases:case_id (
            id,
            title,
            description,
            image_url,
            view_count,
            created_at,
            profiles:author_id (
              display_name,
              username,
              avatar_url
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      const cases = favoriteCases?.map((fav: any) => fav.cases).filter(Boolean) || []
      return NextResponse.json({ favoriteCases: cases })
    } else {
      // 只获取收藏的案例ID列表
      const { data: favorites, error } = await supabaseAuth
        .from('user_favorites')
        .select('case_id')
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      const favoriteIds = favorites?.map((fav: any) => fav.case_id) || []
      return NextResponse.json({ favoriteIds })
    }
  } catch (error) {
    console.error('获取收藏列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 切换收藏状态
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { caseId } = await request.json()

    if (!caseId) {
      return NextResponse.json(
        { error: '案例ID不能为空' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAuth.rpc('toggle_case_favorite', {
      case_id: caseId
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '收藏状态切换成功',
      data,
    })
  } catch (error) {
    console.error('切换收藏状态错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 