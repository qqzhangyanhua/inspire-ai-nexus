import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

// 获取单个案例详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 增加浏览量
    await supabaseAuth.rpc('increment_case_view_count', { case_id: id })

    const { data: caseData, error } = await supabaseAuth
      .from('cases')
      .select(`
        *,
        profiles:author_id (
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!caseData) {
      return NextResponse.json(
        { error: '案例不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ case: caseData })
  } catch (error) {
    console.error('获取案例详情错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新案例
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = await params
    const updateData = await request.json()

    const { data: updatedCase, error } = await supabaseAuth
      .from('cases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '案例更新成功',
      case: updatedCase,
    })
  } catch (error) {
    console.error('更新案例错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 删除案例
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = await params

    const { error } = await supabaseAuth
      .from('cases')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '案例删除成功',
    })
  } catch (error) {
    console.error('删除案例错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 