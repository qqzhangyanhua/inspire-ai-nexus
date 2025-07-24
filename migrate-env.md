# 环境变量迁移指南

## 从 Vite 迁移到 Next.js

请将现有的环境变量从 Vite 格式迁移到 Next.js 格式：

### 1. 查找现有的环境变量

在项目中搜索 `VITE_` 开头的变量，主要包括：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_S3_ENDPOINT`
- `VITE_S3_REGION`

### 2. 更新 .env.local 文件

将找到的环境变量按照以下格式更新到 `.env.local` 文件中：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=你的supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的supabase_anon_key

# S3/Storage Configuration (if needed)
NEXT_PUBLIC_S3_ENDPOINT=你的s3端点
NEXT_PUBLIC_S3_REGION=us-east-1

# Server-side only keys
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

### 3. 重要说明

- `NEXT_PUBLIC_` 前缀的变量会暴露给客户端
- 没有 `NEXT_PUBLIC_` 前缀的变量只能在服务端使用
- Service Role Key 只应该在服务端API routes中使用，不要添加 `NEXT_PUBLIC_` 前缀

### 4. 完成后删除此文件

环境变量配置完成后，可以删除此说明文件。 