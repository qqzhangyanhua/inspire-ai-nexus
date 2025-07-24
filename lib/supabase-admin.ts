import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('缺少 NEXT_PUBLIC_SUPABASE_URL 环境变量')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量')
}

// 服务端管理员客户端 - 拥有完全权限
export const supabaseAuth = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// 导出为默认名称以保持兼容性
export default supabaseAuth 