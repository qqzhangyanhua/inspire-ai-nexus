# Inspire AI Nexus 项目规则

## 1. 项目概述

Inspire AI Nexus 是一个基于 Next.js 15 + TypeScript 的现代化全栈应用，使用 Tailwind CSS 进行样式设计，Shadcn UI 作为组件库，Supabase 作为后端服务，Zustand 进行状态管理，React Query 进行数据获取和缓存。该项目旨在提供 AI 灵感案例的展示、创建和管理平台。

### 1.1 技术栈

- **前端框架**: Next.js 15 (App Router)
- **开发语言**: TypeScript
- **样式框架**: Tailwind CSS + Tailwind Animate
- **UI 组件库**: Shadcn UI (基于 Radix UI)
- **状态管理**: Zustand (支持持久化)
- **数据获取**: React Query (TanStack Query)
- **后端服务**: Supabase (数据库 + 认证 + 存储)
- **表单处理**: React Hook Form + Zod
- **图标库**: Lucide React
- **代码高亮**: React Syntax Highlighter
- **构建工具**: Next.js 内置构建系统
- **包管理器**: npm/pnpm
- **部署平台**: Vercel

## 2. 代码规范

### 2.1 TypeScript 规范

- **类型安全**：尽量避免使用 `any` 类型，优先使用明确的类型定义或 `unknown` 类型
- **接口定义**：为所有数据结构创建明确的接口定义，放置在相关文件的顶部或单独的类型文件中
- **类型导出**：共享的类型定义应从专门的类型文件中导出（如 `integrations/supabase/types.ts`）
- **类型推断**：合理利用 TypeScript 的类型推断，避免冗余的类型注解
- **联合类型**：使用联合类型和字面量类型提高代码的类型安全性
- **泛型**：适当使用泛型增强代码的复用性和类型安全性
- **Supabase 类型**：使用 Supabase 生成的 Database 类型确保数据库操作的类型安全
- **Zod 验证**：使用 Zod 进行运行时类型验证，特别是表单数据和 API 响应
- **Next.js 类型**：正确使用 Next.js 提供的类型（如 `Metadata`、页面组件类型等）

### 2.2 React 组件规范

- **组件拆分**：单个组件不超过 400 行代码，复杂组件应拆分为多个小组件
- **函数组件**：使用函数组件和 React Hooks，避免使用类组件
- **命名规范**：
  - 组件文件名使用 PascalCase（如 `InspirationCard.tsx`）
  - Hook 文件名使用 camelCase 并以 `use` 开头（如 `useAuth.tsx`）
  - 工具函数文件名使用 camelCase（如 `utils.ts`）
  - 页面文件使用 `page.tsx`、布局文件使用 `layout.tsx`（Next.js App Router 约定）
- **组件结构**：
  - 导入语句（React 和第三方库优先）
  - 类型/接口定义
  - 组件函数
  - 辅助函数
  - 导出语句
- **Props 传递**：使用解构赋值接收 props，为复杂 props 定义接口
- **默认导出**：每个组件文件只包含一个组件，并使用默认导出
- **客户端组件**：需要使用浏览器 API 或交互的组件添加 `'use client'` 指令
- **服务端组件**：默认为服务端组件，充分利用 Next.js 的 SSR 能力
- **性能优化**：使用 `React.memo`、`useCallback`、`useMemo` 优化重渲染

### 2.3 样式规范

- **Tailwind CSS 优先**：优先使用 Tailwind CSS 类名进行样式设计，避免自定义 CSS
- **组件库使用**：使用 Shadcn UI 组件库，保持 UI 一致性
- **响应式设计**：使用 Tailwind 的响应式前缀（sm:, md:, lg:, xl:）实现响应式布局
- **主题变量**：使用 CSS 变量和 Tailwind 主题配置管理颜色、间距等设计标准
- **动画效果**：使用 Tailwind 的 transition 和 animation 类实现动画效果

### 2.4 状态管理规范

- **Zustand 使用**：使用 Zustand 进行全局状态管理（用户认证、用户资料等）
- **状态分离**：按功能领域分离状态（用户状态、UI 状态等）
- **持久化**：使用 Zustand 的 persist 中间件实现关键状态持久化
- **React Query**：使用 React Query 进行服务端状态管理和数据缓存
  - 数据获取使用 `useQuery`
  - 数据变更使用 `useMutation`
  - 合理设置缓存时间和重新验证策略
- **本地状态**：组件内部状态使用 useState 和 useReducer 管理
- **派生状态**：使用 useMemo 和 useCallback 优化派生状态和回调函数
- **状态同步**：确保 Zustand 和 React Query 状态的一致性

### 2.5 API 调用规范

- **Supabase 集成**：使用 Supabase 客户端进行 API 调用
- **React Query 集成**：
  - 数据获取使用 `useQuery` 包装 Supabase 调用
  - 数据变更使用 `useMutation` 包装 Supabase 调用
  - 设置合适的查询键（query keys）便于缓存管理
- **错误处理**：
  - 所有 API 调用必须包含错误处理逻辑
  - 使用 React Query 的错误边界或组件级错误处理
  - 提供用户友好的错误提示
- **加载状态**：利用 React Query 的 `isLoading`、`isFetching` 状态
- **数据缓存**：
  - 合理设置 `staleTime` 和 `cacheTime`
  - 使用 `invalidateQueries` 进行数据同步
- **类型安全**：使用 Supabase 生成的 Database 类型确保 API 调用的类型安全
- **认证处理**：确保所有需要认证的 API 调用都包含有效的会话

## 3. 文件组织

### 3.1 目录结构

```
项目根目录/
  ├── app/                    # Next.js App Router 页面和布局
  │   ├── layout.tsx          # 根布局
  │   ├── page.tsx            # 首页
  │   ├── providers.tsx       # 全局提供者
  │   ├── globals.css         # 全局样式
  │   ├── auth/               # 认证相关页面
  │   ├── dashboard/          # 仪表板页面
  │   ├── case/               # 案例相关页面
  │   ├── ai-tools/           # AI 工具页面
  │   └── api/                # API 路由
  ├── components/             # 可复用组件
  │   ├── ui/                 # Shadcn UI 基础组件
  │   ├── Header.tsx          # 页面头部
  │   ├── InspirationCard.tsx # 灵感卡片
  │   └── ...                 # 其他业务组件
  ├── hooks/                  # 自定义 Hooks
  │   ├── useAuth.tsx         # 认证 Hook
  │   ├── use-mobile.tsx      # 移动端检测
  │   └── use-toast.ts        # 提示消息
  ├── integrations/           # 第三方集成
  │   └── supabase/           # Supabase 相关
  │       ├── client.ts       # Supabase 客户端
  │       ├── types.ts        # 数据库类型
  │       └── storage.ts      # 存储服务
  ├── lib/                    # 工具函数和常量
  │   └── utils.ts            # 通用工具函数
  ├── stores/                 # Zustand 状态管理
  │   └── useUserStore.ts     # 用户状态
  ├── server/                 # 服务端 API（如果需要）
  ├── supabase/               # Supabase 配置和迁移
  │   ├── config.toml         # Supabase 配置
  │   └── migrations/         # 数据库迁移文件
  └── public/                 # 静态资源
```

### 3.2 导入规则

- **路径别名**：使用别名导入（`@/`）代替相对路径
- **导入顺序**：
  1. React 和 Next.js 相关导入
  2. 第三方库导入
  3. 自定义 hooks 和工具函数
  4. 组件导入（UI 组件优先，业务组件其次）
  5. 类型导入（使用 `import type`）
  6. 样式导入
- **类型导入**：使用 `import type` 导入仅用于类型的模块
- **动态导入**：对于大型组件使用 `dynamic` 进行代码分割
- **服务端导入**：服务端组件中避免导入客户端专用的库

## 4. 性能优化

### 4.1 Next.js 优化

- **App Router 优化**：
  - 合理使用服务端组件和客户端组件
  - 利用 Next.js 的自动代码分割
  - 使用 `loading.tsx` 和 `error.tsx` 提供更好的用户体验
- **图片优化**：使用 Next.js Image 组件进行自动优化
- **字体优化**：使用 Next.js 字体优化功能
- **缓存策略**：合理配置页面和 API 的缓存策略

### 4.2 React 优化

- **组件优化**：
  - 使用 React.memo 避免不必要的重渲染
  - 使用 useCallback 和 useMemo 缓存函数和计算结果
  - 使用 dynamic 和 Suspense 实现代码分割
- **状态优化**：
  - React Query 缓存减少重复请求
  - Zustand 状态持久化减少初始化时间

### 4.3 资源优化

- **图片资源**：
  - 使用 WebP 格式和适当的尺寸
  - 使用 SVG 代替位图图标
  - 实现图片懒加载
- **代码分割**：按路由和功能进行代码分割
- **Bundle 分析**：定期分析打包大小，移除未使用的依赖

## 5. 测试规范

- **单元测试**：使用 Vitest 编写组件和函数的单元测试
- **组件测试**：使用 React Testing Library 测试组件行为
- **测试覆盖率**：关键功能和组件的测试覆盖率应达到 80% 以上

## 6. 文档规范

- **代码注释**：关键函数和复杂逻辑需添加注释
- **组件文档**：复杂组件应包含使用示例和 Props 说明
- **README**：项目根目录的 README 应包含项目概述、安装步骤和使用说明

## 7. Git 工作流

- **分支命名**：
  - 功能分支：`feature/功能名称`
  - 修复分支：`fix/问题描述`
  - 发布分支：`release/版本号`
- **提交信息**：使用明确的提交信息，包含变更类型和简短描述
- **代码审查**：所有合并到主分支的代码需经过代码审查
- **版本管理**：使用语义化版本控制（Semantic Versioning）

## 8. 安全规范

- **敏感信息**：不在代码中硬编码敏感信息（API 密钥、密码等）
- **输入验证**：所有用户输入必须经过验证
- **认证授权**：使用 Supabase Auth 进行用户认证和授权
- **XSS 防护**：防止跨站脚本攻击

## 9. 可访问性

- **语义化 HTML**：使用语义化的 HTML 标签
- **键盘导航**：确保可以通过键盘完成所有操作
- **屏幕阅读器**：提供适当的 ARIA 属性和替代文本
- **颜色对比度**：确保文本和背景之间有足够的对比度

## 10. 国际化

- **文本外部化**：将用户界面文本外部化，便于翻译
- **日期和数字格式化**：考虑不同地区的日期和数字格式
- **RTL 支持**：考虑从右到左语言的支持

## 11. 环境配置

### 11.1 环境变量

- **Next.js 环境变量**：
  - 公共变量使用 `NEXT_PUBLIC_` 前缀
  - 服务端变量不使用前缀
  - 使用 `.env.local` 存储本地开发配置
- **Supabase 配置**：
  - `NEXT_PUBLIC_SUPABASE_URL`：Supabase 项目 URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase 匿名密钥
  - `SUPABASE_SERVICE_ROLE_KEY`：服务端操作密钥（仅服务端使用）
- **其他配置**：
  - OpenAI API 密钥（如果使用）
  - AWS S3 配置（如果使用文件上传）

### 11.2 开发环境

- **Node.js 版本**：推荐使用 Node.js 18+ 或 20+
- **包管理器**：推荐使用 pnpm 或 npm
- **开发工具**：
  - VS Code + TypeScript 插件
  - ESLint + Prettier 配置
  - Tailwind CSS IntelliSense 插件

### 11.3 部署配置

- **Vercel 部署**：
  - 自动从 Git 仓库部署
  - 配置环境变量
  - 设置自定义域名（如需要）
- **Supabase 生产环境**：
  - 配置生产数据库
  - 设置 RLS 策略
  - 配置存储桶权限

## 12. 持续集成/持续部署

### 12.1 GitHub Actions（推荐）

- **代码检查**：
  - ESLint 代码质量检查
  - TypeScript 类型检查
  - Prettier 代码格式检查
- **自动化测试**：
  - 单元测试和组件测试
  - E2E 测试（如果配置）
- **构建验证**：确保代码可以成功构建

### 12.2 Vercel 部署

- **自动部署**：
  - 主分支自动部署到生产环境
  - 功能分支自动部署到预览环境
- **环境变量管理**：在 Vercel 控制台配置环境变量
- **域名配置**：配置自定义域名和 SSL 证书

### 12.3 数据库迁移

- **Supabase 迁移**：
  - 使用 Supabase CLI 管理数据库迁移
  - 版本控制数据库 schema 变更
  - 生产环境谨慎执行迁移

### 12.4 监控和日志

- **错误监控**：集成错误监控服务（如 Sentry）
- **性能监控**：使用 Vercel Analytics 监控性能
- **日志管理**：合理使用 console.log 和错误日志

## 13. 项目特定规范

### 13.1 AI 功能集成

- **OpenAI 集成**：
  - 合理使用 API 配额，避免过度调用
  - 实现错误重试机制
  - 提供加载状态和用户反馈
- **提示词管理**：
  - 将提示词模板存储在数据库中
  - 支持提示词版本控制
  - 提供提示词测试和优化功能

### 13.2 用户体验规范

- **响应式设计**：确保在所有设备上都有良好的用户体验
- **加载状态**：为所有异步操作提供明确的加载指示
- **错误处理**：提供用户友好的错误信息和恢复建议
- **无障碍访问**：遵循 WCAG 2.1 AA 标准

### 13.3 数据管理

- **数据验证**：
  - 客户端使用 Zod 进行表单验证
  - 服务端使用 Supabase RLS 进行权限控制
- **数据缓存**：
  - 合理使用 React Query 缓存策略
  - 实现乐观更新提升用户体验
- **文件上传**：
  - 支持图片压缩和格式转换
  - 实现上传进度显示
  - 配置合理的文件大小限制

### 13.4 安全最佳实践

- **认证安全**：
  - 使用 Supabase Auth 的安全最佳实践
  - 实现会话管理和自动刷新
  - 配置合理的会话超时时间
- **数据安全**：
  - 敏感数据加密存储
  - 实现数据备份策略
  - 定期安全审计

## 14. 开发工作流

### 14.1 功能开发流程

1. **需求分析**：明确功能需求和技术方案
2. **设计评审**：UI/UX 设计和技术架构评审
3. **开发实现**：按照代码规范进行开发
4. **自测验证**：本地测试和代码自查
5. **代码审查**：提交 PR 进行代码审查
6. **集成测试**：部署到测试环境进行集成测试
7. **生产发布**：合并到主分支并发布到生产环境

### 14.2 代码审查要点

- **功能完整性**：确保功能按需求实现
- **代码质量**：遵循项目代码规范
- **性能考虑**：避免性能瓶颈
- **安全检查**：确保没有安全漏洞
- **测试覆盖**：关键功能有相应测试

### 14.3 发布管理

- **版本号管理**：使用语义化版本控制
- **发布说明**：详细记录每次发布的变更内容
- **回滚计划**：准备快速回滚方案
- **监控告警**：发布后密切监控系统状态

---

**注意**：本规范文档会随着项目发展持续更新，所有团队成员都应该遵循最新版本的规范要求。