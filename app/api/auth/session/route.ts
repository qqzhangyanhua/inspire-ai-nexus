import { NextRequest, NextResponse } from 'next/server'
// import { supabaseAuth } from '@/lib/supabase-admin'

export async function GET(_request: NextRequest) {
  try {
    // 暂时返回无会话状态
    return NextResponse.json({ 
      session: null, 
      user: null 
    })

    // 真实的代码 (当配置真实 Supabase 时使用)
    /*
    const { data: { session }, error } = await supabaseAuth.auth.getSession()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session, user: session?.user || null })
    */
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 