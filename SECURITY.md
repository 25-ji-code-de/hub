# 安全政策 (Security Policy)

## 🔒 支持的版本

我们为以下版本提供安全更新:

| 版本 | 支持状态 |
| --- | --- |
| 最新版本 | ✅ 支持 |
| 旧版本 | ❌ 不支持 |

我们建议始终使用最新版本以获得最佳安全性。

## 🐛 报告漏洞

如果你发现了安全漏洞,**请不要公开披露**。我们非常重视安全问题,并会尽快处理。

### 报告方式

**推荐方式: GitHub Security Advisories**

1. 访问项目的 Security 标签
2. 点击 "Report a vulnerability"
3. 填写漏洞详情
4. 提交报告

**备用方式: 私密 Issue**

如果无法使用 Security Advisories,可以:
1. 创建一个 Issue
2. 标题使用 `[SECURITY]` 前缀
3. 在描述中说明这是安全问题
4. 我们会尽快将其转为私密讨论

### 报告内容

请在报告中包含以下信息:

- **漏洞类型**: XSS、CSRF、认证绕过等
- **影响范围**: 哪些功能/组件受影响
- **复现步骤**: 详细的步骤说明
- **影响评估**: 可能造成的危害
- **修复建议**: 如果有的话
- **环境信息**: 浏览器、操作系统等

### 示例报告

```markdown
## 漏洞类型
XSS (跨站脚本攻击)

## 影响范围
用户资料显示功能

## 复现步骤
1. 登录系统
2. 在资料中输入: `<script>alert('XSS')</script>`
3. 查看资料页面时执行脚本

## 影响评估
攻击者可以窃取用户 Token 或执行恶意操作

## 修复建议
对用户输入进行 HTML 转义处理
```

## ⏱️ 响应时间

- **初步响应**: 48 小时内
- **漏洞确认**: 7 天内
- **修复发布**: 根据严重程度,14-30 天内

## 🎖️ 致谢

我们会在修复发布后公开致谢报告者(除非你要求匿名)。

感谢以下安全研究人员的贡献:
- (待添加)

## 🔐 安全最佳实践

### 对于用户

1. **保持更新**: 使用最新版本
2. **强密码**: 使用复杂且唯一的密码
3. **HTTPS**: 确保使用 HTTPS 访问
4. **警惕钓鱼**: 不要点击可疑链接
5. **Token 安全**: 不要泄露你的访问令牌

### 对于开发者

1. **输入验证**: 验证所有用户输入
2. **输出转义**: 转义所有输出到 HTML 的内容
3. **OAuth 安全**: 正确实现 OAuth 2.1 PKCE 流程
4. **Token 存储**: 使用 httpOnly Cookie 或安全的本地存储
5. **依赖更新**: 定期更新依赖包
6. **代码审查**: 所有代码都需要审查
7. **CORS 配置**: 正确配置跨域访问策略

## 🛡️ 安全功能

本项目实施的安全措施:

- ✅ HTTPS 强制(生产环境)
- ✅ OAuth 2.1 PKCE 认证流程
- ✅ CORS 配置
- ✅ XSS 防护
- ✅ CSRF 防护
- ✅ 安全的 Token 存储
- ✅ State 参数防护(OAuth)
- ✅ Code Challenge 验证(PKCE)

## 🔑 OAuth 安全

SEKAI Hub 使用 OAuth 2.1 PKCE 流程进行认证:

- **PKCE (Proof Key for Code Exchange)**: 防止授权码拦截攻击
- **State 参数**: 防止 CSRF 攻击
- **短期 Token**: Access Token 有效期短
- **Refresh Token 轮换**: 每次刷新都生成新的 Refresh Token

## 📚 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.1 Security Best Practices](https://oauth.net/2.1/)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [Web Security Cheat Sheet](https://cheatsheetseries.owasp.org/)

## 📧 联系方式

如有其他安全相关问题,可以通过以下方式联系:

- GitHub Issues(非敏感问题)
- Security Advisories(敏感问题)

---

感谢你帮助我们保持项目的安全!

<div align="center">

**安全是我们的首要任务**

Made with 💜 by the [25-ji-code-de](https://github.com/25-ji-code-de) team

</div>
