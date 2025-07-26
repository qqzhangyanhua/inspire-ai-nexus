# Inspire AI Nexus

一个基于 Next.js 的创意灵感分享和 AI 工具平台，帮助用户创建、分享和管理创意案例，并提供 AI 驱动的工具来生成 HTML 代码。

## 项目特色

- 🎨 **创意案例分享** - 用户可以创建、编辑和分享自己的创意设计案例
- 🤖 **AI 工具箱** - 支持图片转 HTML 和提示词转 HTML 的 AI 功能
- 📱 **现代化 UI** - 使用 Tailwind CSS 和 shadcn/ui 构建的响应式界面
- 👥 **用户管理** - 完整的用户认证、个人资料和权限管理系统
- 📊 **数据分析** - 提供详细的数据统计和分析功能
- 🔍 **搜索过滤** - 支持案例搜索、分类过滤和标签系统

## 技术栈

### 前端框架
- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全的 JavaScript
- **Tailwind CSS** - 原子化 CSS 框架
- **shadcn/ui** - 高质量的 React 组件库

### 状态管理和数据
- **Zustand** - 轻量级状态管理
- **Supabase** - 后端服务和数据库
- **React Query** - 数据获取和缓存

### UI 组件和工具
- **Radix UI** - 无样式的可访问性组件
- **Lucide React** - 图标库
- **React Hook Form** - 表单管理
- **React Syntax Highlighter** - 代码高亮显示

## 项目结构

```
inspire-ai-nexus/
├── app/                    # Next.js 应用路由
│   ├── ai-tools/          # AI 工具页面
│   ├── api/               # API 路由
│   │   └── ai/           # AI 相关 API
│   ├── auth/             # 认证页面
│   ├── case/             # 案例相关页面
│   └── dashboard/        # 用户仪表板
├── components/            # React 组件
│   ├── ui/               # 基础 UI 组件
│   └── ...               # 业务组件
├── hooks/                # 自定义 React Hooks
├── integrations/         # 第三方服务集成
│   └── supabase/        # Supabase 配置
├── lib/                  # 工具函数
├── stores/               # Zustand 状态管理
└── supabase/            # 数据库迁移文件
```

## 主要功能

### 1. 案例管理系统
- 创建和编辑创意案例
- 支持图片上传和展示
- 实时代码编辑器
- 案例状态管理（草稿、发布、审批）

### 2. AI 工具箱
- **图片转 HTML**：上传 UI 设计图，AI 生成对应的 HTML 代码
- **提示词转 HTML**：通过文字描述生成 HTML 代码
- 支持 Tailwind CSS 样式生成
- 实时预览和代码导出

### 3. 用户系统
- 完整的用户认证流程
- 个人资料管理
- 权限控制（普通用户/管理员）
- 数据统计和分析

### 4. 社交功能
- 点赞和收藏案例
- 案例评论系统
- 用户互动统计

## 开发脚本

```json
{
  "dev": "next dev",           # 启动开发服务器
  "build": "next build",       # 构建生产版本
  "start": "next start",       # 启动生产服务器
  "lint": "next lint",         # 代码检查
  "type-check": "tsc --noEmit" # 类型检查
}
```

## 环境配置

```bash
# 设置 Anthropic API（用于 AI 功能）
export ANTHROPIC_API_KEY=your_api_key_here
export ANTHROPIC_BASE_URL=https://api.anthropic.com

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 数据库策略

项目使用 Supabase 作为后端服务，包含以下安全策略：

```sql
-- 允许查看存储桶列表
CREATE POLICY "Allow bucket list" ON storage.buckets FOR SELECT USING (true);

-- 允许认证用户上传文件
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'images');

-- 允许公开读取文件
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'images');
```

## 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd inspire-ai-nexus
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 文件，填入相应的配置
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 `http://localhost:3000`

## 项目亮点

- **AI 驱动的代码生成**：集成 OpenAI GPT-4 Vision 模型，支持图片到代码的智能转换
- **模块化架构**：清晰的文件结构和组件分离，便于维护和扩展
- **类型安全**：全面使用 TypeScript，提供更好的开发体验
- **响应式设计**：适配各种设备尺寸，提供优秀的用户体验
- **数据安全**：使用 Supabase RLS 策略确保数据安全
- **性能优化**：使用 Next.js 的各种优化特性，包括图片优化、代码分割等
```sh
unset ANTHROPIC_API_KEY
export ANTHROPIC_AUTH_TOKEN=sk-DaauGPJV8T1Ec5ytbUoPpgsF3IyGuHJIAbEJ8Ap59a9DvmZr
 export ANTHROPIC_BASE_URL=https://anyrouter.top 
```