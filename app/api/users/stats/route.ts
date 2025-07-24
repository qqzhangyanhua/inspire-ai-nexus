import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

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

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      )
    }

    // 获取用户案例基本信息
    const { data: cases, error: casesError } = await supabaseAuth
      .from('cases')
      .select('id, view_count')
      .eq('author_id', userId)

    if (casesError) {
      return NextResponse.json(
        { error: casesError.message },
        { status: 400 }
      )
    }

    // 计算基本统计数据
    const totalCases = cases?.length || 0
    const totalViews = cases?.reduce((sum: number, case_: any) => sum + (case_.view_count || 0), 0) || 0

    // 获取真实的点赞数量
    let totalLikes = 0
    if (cases && cases.length > 0) {
      const caseIds = cases.map((c: any) => c.id)
      const { data: likes, error: likesError } = await supabaseAuth
        .from('user_favorites')
        .select('case_id')
        .in('case_id', caseIds)

      if (likesError && likesError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: likesError.message },
          { status: 400 }
        )
      }
      
      totalLikes = likes?.length || 0
    }

    // 获取评论数量
    let totalComments = 0
    if (cases && cases.length > 0) {
      const caseIds = cases.map((c: any) => c.id)
      const { data: comments, error: commentsError } = await supabaseAuth
        .from('case_comments')
        .select('id')
        .in('case_id', caseIds)

      if (commentsError && commentsError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: commentsError.message },
          { status: 400 }
        )
      }
      
      totalComments = comments?.length || 0
    }

    // 获取收藏数量
    const { data: favorites, error: favoritesError } = await supabaseAuth
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)

    if (favoritesError && favoritesError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: favoritesError.message },
        { status: 400 }
      )
    }

    const totalFavorites = favorites?.length || 0

    const stats = {
      totalCases,
      totalViews,
      totalLikes,
      totalComments,
      totalFavorites,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('获取用户统计错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 