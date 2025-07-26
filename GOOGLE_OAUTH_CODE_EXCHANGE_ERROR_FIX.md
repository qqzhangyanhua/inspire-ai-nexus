# Google OAuth "Unable to exchange external code" 错误修复指南

## 错误描述
```
OAuth错误: server_error Unable to exchange external code: 4/0AVMBsJgvGwsqVp0rXA30fdkv58Bv77dg1ryQa6-1Dtm81V9iEGGPVXD3M_yFV15Wt5yRag
```

## 错误分析

这个错误发生在 OAuth 2.0 流程的第二步：
1. ✅ **用户成功通过 Google 认证** - 获得了授权码 `4/0AVMBsJgvGwsqVp0rXA30fdkv58Bv77dg1ryQa6-1Dtm81V9iEGGPVXD3M_yFV15Wt5yRag`
2. ❌ **Supabase 无法用授权码换取访问令牌** - 在向 Google 的 token 端点发送请求时失败

## 常见原因

1. **Google OAuth 客户端配置错误**
   - Client ID 或 Client Secret 不匹配
   - 重定向 URI 配置不正确
   - OAuth 同意屏幕配置问题

2. **Supabase 配置错误**
   - Google Provider 中的凭据配置错误
   - 回调 URL 设置不当

3. **域名和 URL 不匹配**
   - 开发环境和生产环境 URL 混淆
   - HTTP/HTTPS 协议不匹配

## 修复步骤

### 步骤 1：检查 Google Cloud Console 配置

#### 1.1 访问 Google Cloud Console
1. 登录 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目
3. 导航到 **APIs & Services** → **Credentials**

#### 1.2 检查 OAuth 2.0 客户端 ID
找到您的 OAuth 2.0 客户端 ID，检查以下配置：

**授权的重定向 URI 必须包含：**
```
https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback
```

**开发环境（可选）：**
```
http://localhost:3000
```

⚠️ **重要**：URI 必须完全匹配，包括协议（http/https）、域名、端口和路径。

#### 1.3 检查 OAuth 同意屏幕
1. 导航到 **APIs & Services** → **OAuth consent screen**
2. 确保配置状态为 **已发布** 或 **测试中**
3. 检查授权域名是否包含 `supabase.co`

#### 1.4 记录凭据信息
复制以下信息（稍后需要在 Supabase 中使用）：
- **客户端 ID**
- **客户端密钥**

### 步骤 2：检查 Supabase 配置

#### 2.1 访问 Supabase Dashboard
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目：`gsrqdvzwaqycpmxvitai`
3. 导航到 **Authentication** → **Providers**

#### 2.2 配置 Google Provider
找到 **Google** 提供商，确保以下配置正确：

```
✅ Enabled: 开启
📝 Client ID: [从 Google Console 复制的客户端 ID]
🔐 Client Secret: [从 Google Console 复制的客户端密钥]
🔗 Redirect URL: https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback
```

⚠️ **注意**：
- Client ID 和 Client Secret 必须与 Google Console 中的完全一致
- 不要有多余的空格或换行符
- Redirect URL 是自动生成的，通常不需要修改

### 步骤 3：验证域名配置

#### 3.1 检查 Google Console 中的授权域名
在 OAuth 同意屏幕中，确保 **授权域名** 包含：
```
supabase.co
```

#### 3.2 检查重定向 URI 的完整性
确保 Google Console 中的重定向 URI 与 Supabase 显示的完全一致：
```
https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback
```

### 步骤 4：清理和重新测试

#### 4.1 清理浏览器缓存
```bash
# 清理浏览器缓存和 Cookie
# 或使用无痕模式进行测试
```

#### 4.2 重新启动开发服务器
```bash
cd /Users/zhangyanhua/Desktop/AI/inspire-ai-nexus
npm run dev
```

#### 4.3 测试 OAuth 流程
1. 访问 `http://localhost:3000/auth`
2. 点击 "使用 Google 账户登录"
3. 完成 Google 认证流程
4. 检查是否成功跳转回应用

### 步骤 5：高级故障排除

#### 5.1 检查 Supabase 日志
1. 在 Supabase Dashboard 中导航到 **Logs**
2. 查看 **Auth** 日志
3. 寻找与 Google OAuth 相关的错误信息

#### 5.2 验证 API 启用状态
在 Google Cloud Console 中确保以下 API 已启用：
- **Google+ API** (已弃用，但可能仍需要)
- **People API**
- **Google Identity and Access Management (IAM) API**

#### 5.3 检查配额和限制
1. 在 Google Cloud Console 中检查 **APIs & Services** → **Quotas**
2. 确保没有超出 OAuth 请求限制

### 步骤 6：创建新的 OAuth 客户端（如果必要）

如果上述步骤都无法解决问题，可以尝试创建新的 OAuth 客户端：

#### 6.1 在 Google Cloud Console 中
1. 导航到 **APIs & Services** → **Credentials**
2. 点击 **+ CREATE CREDENTIALS** → **OAuth client ID**
3. 选择 **Web application**
4. 设置名称：`Inspire AI Nexus - New`
5. 添加授权的重定向 URI：
   ```
   https://gsrqdvzwaqycpmxvitai.supabase.co/auth/v1/callback
   ```
6. 点击 **CREATE**

#### 6.2 更新 Supabase 配置
使用新的 Client ID 和 Client Secret 更新 Supabase 中的 Google Provider 配置。

## 验证修复

### 成功指标
- ✅ 用户可以点击 Google 登录按钮
- ✅ 成功跳转到 Google 认证页面
- ✅ 完成 Google 认证后成功跳转回应用
- ✅ 用户信息正确显示在应用中
- ✅ 用户可以正常使用应用功能

### 测试清单
- [ ] 清理浏览器缓存
- [ ] 使用无痕模式测试
- [ ] 测试不同的 Google 账户
- [ ] 检查用户资料是否正确创建
- [ ] 验证用户权限和功能访问

## 常见错误和解决方案

### 错误："redirect_uri_mismatch"
**解决方案**：确保 Google Console 中的重定向 URI 与 Supabase 的完全一致。

### 错误："invalid_client"
**解决方案**：检查 Client ID 和 Client Secret 是否正确复制到 Supabase。

### 错误："access_denied"
**解决方案**：检查 OAuth 同意屏幕配置和用户权限。

### 错误："unauthorized_client"
**解决方案**：确保 OAuth 客户端类型为 "Web application"。

## 预防措施

1. **定期检查配置**：Google 和 Supabase 的配置可能会因为更新而改变
2. **备份凭据**：安全地备份 OAuth 凭据信息
3. **监控日志**：定期检查认证相关的错误日志
4. **测试环境**：在生产环境部署前在测试环境验证 OAuth 配置

## 联系支持

如果问题仍然存在，可以联系：
- **Supabase 支持**：通过 Dashboard 提交支持票据
- **Google Cloud 支持**：如果是 Google OAuth 配置问题

---

**最后更新**：2025年1月27日
**适用版本**：Supabase v2.x, Next.js 15.x