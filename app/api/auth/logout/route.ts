import { NextRequest, NextResponse } from 'next/server'
import { supabaseAuth } from '@/lib/supabase-admin'

export async function POST(_request: NextRequest) {
  try {
    const { error } = await supabaseAuth.auth.signOut({ scope: 'global' })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '登出成功',
    })
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
} 