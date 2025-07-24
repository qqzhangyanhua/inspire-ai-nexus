import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

// 获取评论列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json(
        { error: '案例ID不能为空' },
        { status: 400 }
      )
    }

    const { data: comments, error } = await supabaseAuth
      .from('case_comments')
      .select(`
        *,
        profiles:author_id (
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('获取评论列表错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 创建新评论
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const commentData = await request.json()

    const { data: newComment, error } = await supabaseAuth
      .from('case_comments')
      .insert(commentData)
      .select(`
        *,
        profiles:author_id (
          display_name,
          username,
          avatar_url
        )
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '评论创建成功',
      comment: newComment,
    })
  } catch (error) {
    console.error('创建评论错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 