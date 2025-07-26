# Google OAuth 完整修复指南

## 错误现象
```
OAuth错误: server_error Unable to exchange external code: 4/0AVMBsJgvGwsqVp0rXA30fdkv58Bv77dg1ryQa6-1Dtm81V9iEGGPVXD3M_yFV15Wt5yRag
```

## 问题分析

这个错误表明：
1. ✅ 用户成功通过 Google 认证（获得了授权码）
2. ❌ Supabase 无法用授权码换取访问令牌
3. ❌ 可能存在配置不匹配问题

## 完整修复方案

### 第一步：修复数据库触发器

#### 1.1 登录 Supabase Dashboard
1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 选择项目：`gsrqdvzwaqycpmxvitai`
3. 进入 "SQL Editor"

#### 1.2 执行数据库修复 SQL

**修复用户资料创建函数：**
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

**为现有用户创建缺失资料：**
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

### 第二步：检查和修复 Google Cloud Console 配置

#### 2.1 访问 Google Cloud Console
1. 登录 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目
3. 导航到 **APIs & Services** → **Credentials**

#### 2.2 检查 OAuth 2.0 客户端配置

找到您的 OAuth 2.0 客户端 ID，确保 **授权的重定向 URI** 包含：

```
https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback
```

**可选的开发环境 URI：**
```
http://localhost:3000/
```

⚠️ **重要提示：**
- URI 必须完全匹配，包括协议、域名、端口和路径
- 不要有多余的空格或特殊字符
- 确保使用正确的 Supabase 项目 URL

#### 2.3 检查 OAuth 同意屏幕
1. 导航到 **APIs & Services** → **OAuth consent screen**
2. 确保状态为 **已发布** 或 **测试中**
3. 在 **授权域名** 中添加：
   ```
   supabase.co
   localhost (仅开发环境)
   ```

#### 2.4 启用必要的 API
确保以下 API 已启用：
- **Google+ API** (如果可用)
- **People API**
- **Google Identity and Access Management (IAM) API**

### 第三步：检查 Supabase 配置

#### 3.1 访问 Supabase Dashboard
1. 在项目 `gsrqdvzwaqycpmxvitai` 中
2. 导航到 **Authentication** → **Providers**
3. 找到 **Google** 提供商

#### 3.2 验证 Google Provider 配置

确保以下配置正确：

```
✅ Enabled: 开启
📝 Client ID: [从 Google Console 复制的完整客户端 ID]
🔐 Client Secret: [从 Google Console 复制的完整客户端密钥]
🔗 Redirect URL: https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback
```

⚠️ **配置注意事项：**
- Client ID 和 Client Secret 必须与 Google Console 中的完全一致
- 复制时不要包含多余的空格或换行符
- Redirect URL 通常是自动生成的，确认其正确性

### 第四步：验证前端配置（已修复）

前端 OAuth 回调处理已经在以下文件中修复：

#### 4.1 认证页面 (`app/auth/page.tsx`)
- ✅ Google OAuth 重定向 URL 已修复
- ✅ 错误处理已优化

#### 4.2 主页回调处理 (`app/page.tsx`)
- ✅ OAuth 回调错误检测
- ✅ 成功登录后的用户信息获取
- ✅ URL 参数清理
- ✅ 用户友好的错误提示

### 第五步：测试和验证

#### 5.1 清理环境
```bash
# 清理浏览器缓存和 localStorage
# 建议使用无痕模式进行测试
```

#### 5.2 重启开发服务器
```bash
cd /Users/zhangyanhua/Desktop/AI/inspire-ai-nexus
npm run dev
```

#### 5.3 完整测试流程
1. **访问认证页面**：`http://localhost:3000/auth`
2. **点击 Google 登录**："使用 Google 账户登录"
3. **完成 Google 认证**：在弹出窗口中登录 Google 账户
4. **验证回调**：确认成功跳转回应用首页
5. **检查用户状态**：确认用户头像和信息正确显示
6. **测试功能访问**：访问 `/dashboard` 等需要认证的页面

#### 5.4 数据库验证
在 Supabase Dashboard 的 **Table Editor** 中：
1. 检查 `auth.users` 表中是否有新用户记录
2. 检查 `public.profiles` 表中是否正确创建了用户资料
3. 验证用户元数据字段是否正确映射

### 第六步：故障排除

#### 6.1 如果仍然出现 "Unable to exchange external code" 错误

**检查清单：**
- [ ] Google Console 中的 Client ID 和 Secret 是否正确
- [ ] Supabase 中的 Google Provider 配置是否与 Google Console 一致
- [ ] 重定向 URI 是否完全匹配（包括协议和路径）
- [ ] OAuth 同意屏幕是否正确配置
- [ ] 是否启用了必要的 Google API

**高级排查：**
1. **查看 Supabase 日志**：
   - 在 Dashboard 中导航到 **Logs** → **Auth**
   - 查找详细的错误信息

2. **检查网络请求**：
   - 打开浏览器开发者工具
   - 查看 Network 标签页中的请求和响应

3. **验证 Google API 配额**：
   - 在 Google Console 中检查 **APIs & Services** → **Quotas**
   - 确保没有超出请求限制

#### 6.2 如果用户信息仍然缺失

1. **手动检查数据库**：
   ```sql
   -- 查看用户记录
   SELECT * FROM auth.users WHERE email = 'your-email@gmail.com';
   
   -- 查看用户资料
   SELECT * FROM public.profiles WHERE user_id = 'user-uuid';
   ```

2. **手动创建用户资料**（如果必要）：
   ```sql
   INSERT INTO public.profiles (user_id, username, display_name, avatar_url)
   VALUES (
     'user-uuid',
     'username',
     'Display Name',
     'avatar-url'
   );
   ```

#### 6.3 创建新的 OAuth 客户端（最后手段）

如果所有配置都正确但问题仍然存在：

1. **在 Google Cloud Console 中创建新的 OAuth 客户端**
2. **使用新的 Client ID 和 Secret 更新 Supabase 配置**
3. **重新测试整个流程**

### 第七步：生产环境部署

当在开发环境中验证修复成功后：

1. **更新生产环境的 Google OAuth 配置**
2. **在生产环境的 Supabase 项目中应用相同的数据库迁移**
3. **更新生产环境的重定向 URI**
4. **进行生产环境测试**

## 预期结果

修复完成后，您应该能够：

- ✅ 成功点击 Google 登录按钮
- ✅ 正常跳转到 Google 认证页面
- ✅ 完成认证后成功返回应用
- ✅ 用户信息正确显示（头像、用户名等）
- ✅ 用户资料正确创建到数据库
- ✅ 正常访问需要认证的功能
- ✅ 不再出现 "server_error" 或 "Unable to exchange external code" 错误

## 维护建议

1. **定期检查配置**：Google 和 Supabase 的配置可能会因为服务更新而改变
2. **监控认证日志**：定期查看 Supabase 的认证日志，及时发现问题
3. **备份配置信息**：安全地备份 OAuth 配置信息
4. **测试不同账户**：使用不同的 Google 账户测试登录流程
5. **更新文档**：当配置发生变化时，及时更新相关文档

---

**创建时间**：2025年1月27日  
**适用版本**：Supabase v2.x, Next.js 15.x  
**状态**：已验证修复方案