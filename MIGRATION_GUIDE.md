# Next.js 迁移指南

## 📋 迁移概览

本指南帮助你将 React + Vite 项目迁移到 Next.js，并对 Supabase 接口进行封装中转。

## ✅ 已完成的迁移工作

### 1. 项目结构迁移
- ✅ 创建了 Next.js app 目录结构
- ✅ 配置了 Next.js 相关文件（next.config.js, tsconfig.json）
- ✅ 更新了 package.json 脚本和依赖

### 2. API 封装
- ✅ 创建了完整的 API routes 封装 Supabase 接口
- ✅ 认证接口：登录、注册、登出、会话管理
- ✅ 案例管理：增删改查、浏览量统计
- ✅ 用户管理：资料更新、统计数据
- ✅ 收藏功能：切换收藏、获取收藏列表
- ✅ 评论系统：获取评论、创建评论
- ✅ 文件上传：安全的文件上传接口

### 3. 环境变量迁移
- ✅ 创建了 .env.local 和 .env.example
- ✅ 从 VITE_ 格式迁移到 NEXT_PUBLIC_ 格式

### 4. 页面路由迁移
- ✅ 创建了所有页面的 Next.js 路由
- ✅ 保持与原有路由结构的兼容性

## 🔧 需要手动完成的步骤

### 1. 安装依赖
```bash
# 删除旧的依赖
npm uninstall vite @vitejs/plugin-react-swc vite-plugin-* eslint-plugin-react-refresh

# 安装 Next.js 相关依赖
npm install next@latest react@latest react-dom@latest
npm install --save-dev eslint-config-next
```

### 2. 环境变量配置

将你现有的环境变量从 Vite 格式转换为 Next.js 格式：

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=你的_supabase_项目_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
```

### 3. 更新客户端代码

更新现有组件以使用新的 API 客户端：

```typescript
// 原来直接使用 supabase
import { supabase } from '@/integrations/supabase/client'
const { data, error } = await supabase.from('cases').select('*')

// 改为使用 API routes
import { casesAPI } from '@/lib/api'
const response = await casesAPI.getCases()
```

### 4. 删除不需要的文件

迁移完成后可以删除：
- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `migrate-env.md`
- 旧的 Vite 相关配置文件

## 🚀 启动项目

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm run start
```

## 📁 新的目录结构

```
inspire-ai-nexus/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (Supabase 封装)
│   ├── auth/              # 认证页面
│   ├── case/[id]/         # 案例详情页面
│   ├── dashboard/         # 仪表板页面
│   └── layout.tsx         # 根布局
├── lib/                   # 工具库
│   ├── api.ts            # API 客户端
│   ├── supabase.ts       # Supabase 配置
│   └── queryClient.ts    # React Query 配置
├── src/                   # 现有组件和页面（保持不变）
└── .env.local            # 环境变量
```

## 🔐 API 接口安全性

所有 Supabase 接口都已封装到 API routes 中：

- **客户端**: 只能访问 `/api/*` 接口，无法直接访问 Supabase
- **服务端**: 使用 Service Role Key 进行数据库操作
- **认证**: 通过 JWT token 验证用户身份
- **权限**: 在 API routes 中实现业务逻辑和权限检查

## 📖 API 使用示例

```typescript
import { casesAPI, authAPI, favoritesAPI } from '@/lib/api'

// 获取案例列表
const cases = await casesAPI.getCases({ page: 1, limit: 12 })

// 用户登录
const result = await authAPI.login(email, password)

// 切换收藏
await favoritesAPI.toggleFavorite(caseId)
```

## ⚠️ 注意事项

1. **环境变量**: 确保所有环境变量都正确配置
2. **路由**: Next.js 使用基于文件系统的路由，确保页面文件在正确位置
3. **导入路径**: 更新所有导入路径以使用新的别名配置
4. **Supabase**: 只在 API routes 中使用 supabaseAdmin，客户端使用 API 接口

## 🆘 常见问题

### Q: 如何处理客户端的 Supabase 调用？
A: 使用 `/lib/api.ts` 中的封装函数替代直接的 Supabase 调用。

### Q: 环境变量不生效？
A: 确保环境变量名使用 `NEXT_PUBLIC_` 前缀（客户端）或不使用前缀（服务端）。

### Q: API routes 返回 401 错误？
A: 检查认证 token 是否正确传递，确保用户已登录。

## 📞 技术支持

如有问题，请检查：
1. 环境变量配置
2. 依赖安装
3. Next.js 文档：https://nextjs.org/docs

迁移完成后，你的项目将具有更好的安全性和可维护性！ 