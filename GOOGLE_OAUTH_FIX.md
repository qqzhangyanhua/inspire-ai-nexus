# Google OAuth 用户信息修复指南

## 问题描述
Google OAuth 登录成功后，用户信息没有正确创建到 profiles 表中，导致用户无法正常使用系统功能。

## 问题原因
原始的 `handle_new_user()` 函数假设用户元数据中包含 `username` 和 `display_name` 字段，但 Google OAuth 实际返回的字段名不同（如 `full_name`、`name` 等）。

## 修复方案

### 1. 应用数据库迁移
运行以下命令应用修复：

```bash
# 方法1：使用 Supabase CLI（推荐）
npx supabase db reset

# 方法2：如果上述命令失败，手动应用迁移
npx supabase db push
```

### 2. 手动应用修复（如果 CLI 不可用）
如果无法使用 Supabase CLI，可以在 Supabase Dashboard 的 SQL Editor 中依次执行：

1. 执行 `supabase/migrations/20250127000000-fix-google-oauth-profile-creation.sql`
2. 执行 `supabase/migrations/20250127000001-create-missing-profiles.sql`

### 3. 验证修复
修复完成后：
1. 新的 Google OAuth 用户登录时会自动创建正确的 profile
2. 已存在的 Google OAuth 用户会补充创建缺失的 profile

## 修复内容

### 更新的 `handle_new_user()` 函数
- 使用 `COALESCE` 函数处理多种可能的字段名
- 支持 Google OAuth 常见的元数据字段：`full_name`、`name`、`preferred_username` 等
- 如果没有合适的显示名称，使用邮箱前缀作为备选
- 自动提取头像 URL

### 字段映射
- **username**: `username` → `preferred_username` → 邮箱前缀
- **display_name**: `display_name` → `full_name` → `name` → 邮箱前缀
- **avatar_url**: 直接从 `avatar_url` 字段获取

## 测试
修复后，可以通过以下方式测试：
1. 使用新的 Google 账户登录
2. 检查 profiles 表是否正确创建了用户记录
3. 验证用户信息是否正确显示在前端界面