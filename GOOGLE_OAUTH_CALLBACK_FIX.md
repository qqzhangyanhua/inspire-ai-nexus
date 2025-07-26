# Google OAuth 回调错误修复指南

## 问题描述
用户反馈 Google OAuth 登录回调时出现 `error=server_error` 错误，页面 URL 显示：
```
http://localhost:3000/?error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code
```

## 问题原因
1. **数据库触发器问题**：`handle_new_user()` 函数无法正确处理 Google OAuth 返回的用户元数据
2. **回调处理缺失**：首页缺少处理 OAuth 回调的逻辑
3. **Google OAuth 配置问题**：可能的 Supabase OAuth 配置不当

## 修复步骤

### 1. 应用数据库迁移（必须）

由于 Node.js 权限问题，请手动在 Supabase Dashboard 中执行以下 SQL：

#### 步骤 1：登录 Supabase Dashboard
1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 选择您的项目：`gsrqdvzwaqycpmxvitai`
3. 进入 "SQL Editor"

#### 步骤 2：执行修复 SQL
复制并执行以下 SQL 语句：

```sql
-- 修复 Google OAuth 用户资料创建函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'preferred_username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 步骤 3：为现有用户创建缺失的资料
```sql
-- 为现有 Google OAuth 用户创建缺失的资料
INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'preferred_username',
    split_part(au.email, '@', 1)
  ) as username,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ) as display_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL
  AND au.email IS NOT NULL;
```

### 2. 检查 Google OAuth 配置

#### 在 Supabase Dashboard 中：
1. 进入 "Authentication" → "Providers"
2. 找到 "Google" 提供商
3. 确保以下配置正确：
   - **Enabled**: ✅ 开启
   - **Client ID**: 您的 Google OAuth Client ID
   - **Client Secret**: 您的 Google OAuth Client Secret
   - **Redirect URL**: `https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback`

#### 在 Google Cloud Console 中：
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 "APIs & Services" → "Credentials"
3. 找到您的 OAuth 2.0 客户端 ID
4. 确保 "Authorized redirect URIs" 包含：
   - `https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback`
   - `http://localhost:3000` (开发环境)

### 3. 前端回调处理（已修复）

首页 (`app/page.tsx`) 已经添加了 OAuth 回调处理逻辑：
- 检测 URL 中的错误参数并显示友好的错误消息
- 处理成功的 OAuth 回调并获取用户信息
- 自动清理 URL 参数

### 4. 测试修复

1. **清理浏览器缓存和 localStorage**
2. **重新尝试 Google 登录**：
   - 访问 `http://localhost:3000/auth`
   - 点击 "使用 Google 账户登录"
   - 完成 Google 认证流程
3. **验证结果**：
   - 登录成功后应该跳转到首页
   - 检查用户头像和用户名是否正确显示
   - 访问 `/dashboard` 确认用户资料正常

### 5. 故障排除

#### 如果仍然出现 server_error：
1. **检查 Google OAuth 配置**：确保 Client ID 和 Secret 正确
2. **检查重定向 URL**：确保 Google Console 和 Supabase 中的 URL 一致
3. **查看 Supabase 日志**：在 Dashboard 的 "Logs" 部分查看详细错误信息

#### 如果用户信息仍然缺失：
1. **检查数据库**：在 Supabase Dashboard 的 "Table Editor" 中查看 `profiles` 表
2. **手动创建资料**：如果需要，可以手动在 `profiles` 表中添加用户记录

### 6. 开发环境重启

修复完成后，重启开发服务器：
```bash
npm run dev
# 或
pnpm dev
```

## 预期结果

修复完成后：
1. Google OAuth 登录应该正常工作
2. 用户信息会正确创建到 `profiles` 表
3. 登录后用户可以正常使用所有功能
4. 不再出现 `server_error` 错误

## 注意事项

- 确保在生产环境中也应用相同的数据库迁移
- 定期检查 Google OAuth 配置的有效性
- 如果更改域名，需要更新 Google Console 中的重定向 URL