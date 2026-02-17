# SEKAI Hub

<div align="center">

![GitHub License](https://img.shields.io/github/license/25-ji-code-de/hub?style=flat-square&color=884499)
![GitHub stars](https://img.shields.io/github/stars/25-ji-code-de/hub?style=flat-square&color=884499)
![GitHub forks](https://img.shields.io/github/forks/25-ji-code-de/hub?style=flat-square&color=884499)
![GitHub issues](https://img.shields.io/github/issues/25-ji-code-de/hub?style=flat-square&color=884499)
![GitHub last commit](https://img.shields.io/github/last-commit/25-ji-code-de/hub?style=flat-square&color=884499)

</div>

SEKAI 生态系统的统一门户和用户中心，连接所有 SEKAI 项目。

## ✨ 特性

- 🏠 **生态门户** - 展示所有 SEKAI 项目、架构图和文档
- 👤 **用户中心** - 登录后查看跨项目数据看板
- 🔐 **SSO 认证** - 基于 OAuth 2.1 PKCE 的安全认证
- 📊 **统计数据** - 跨项目活动统计和用户资料
- 🚀 **快速入口** - 一键访问生态内所有项目
- 🎨 **响应式设计** - 适配桌面和移动端

## 🚀 快速开始

### 在线访问

访问 **[hub.nightcord.de5.net](https://hub.nightcord.de5.net)** 直接使用。

### 本地开发

由于使用了 ES Modules 和 OAuth 跳转，你需要一个本地服务器来运行此项目。

#### 前置要求

- Python 3（用于快速启动本地服务器）
- 或任何其他静态文件服务器

#### 运行

```bash
# 克隆仓库
git clone https://github.com/25-ji-code-de/hub.git
cd hub

# 启动本地服务器
python3 -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000
```

然后访问: `http://localhost:8000`

> **注意**: OAuth 回调需要在 SEKAI Pass 中配置 `http://localhost:8000/callback` 作为允许的回调地址。如果遇到 CORS 或回调错误，请联系管理员添加本地开发回调地址。

## 📁 项目结构

```
.
├── index.html              # 主入口 (单页应用)
├── callback/
│   └── index.html          # OAuth 回调处理
├── assets/
│   ├── css/
│   │   └── style.css       # 样式表
│   └── js/
│       ├── auth.js         # OAuth 2.1 PKCE 实现
│       ├── config.js       # 配置文件
│       └── main.js         # 主逻辑
└── README.md
```

## 🛠️ 技术栈

- **前端框架**: 原生 JavaScript (ES6+ Modules)
- **认证协议**: OAuth 2.1 PKCE
- **样式**: CSS3 + Custom Properties
- **部署平台**: Cloudflare Pages
- **字体**: Inter (Google Fonts)

## 🔗 生态架构

```
                    ┌─────────────────────┐
                    │   SEKAI Pass        │
                    │  (SSO 认证系统)      │
                    │  OAuth 2.1 / OIDC   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
    │   Nightcord     │ │ 25ji_sagyo  │ │  未来项目    │
    │  (聊天应用)      │ │  (学习工具)  │ │              │
    └────────┬────────┘ └──────┬──────┘ └──────────────┘
             │                 │
             ▼                 ▼
    ┌─────────────────┐ ┌─────────────────┐
    │ Nako            │ │   pjsekai       │
    │ (AI 机器人 API)  │ │ (CDN & API 网关) │
    └─────────────────┘ └─────────────────┘
```

## ⚙️ 配置

在 `assets/js/config.js` 中修改 OAuth 配置:

```javascript
export const CONFIG = {
    clientId: 'sekai_hub_client',
    authorizationEndpoint: 'https://id.nightcord.de5.net/authorize',
    tokenEndpoint: 'https://id.nightcord.de5.net/token',
    redirectUri: window.location.origin + '/callback',
    scope: 'openid profile read:user_basic read:25ji_stats read:nightcord_stats'
};
```

## 🚀 部署

### Cloudflare Pages

1. 将代码推送到 Git 仓库
2. 在 Cloudflare Pages 创建新项目
3. 构建设置:
   - **框架预设**: None
   - **构建命令**: (空)
   - **输出目录**: (空, 或 `.`)
4. 部署完成后，在 SEKAI Pass 中添加生产环境回调地址

### 其他静态托管平台

本项目是纯静态网站，可以部署到任何静态托管平台:
- Vercel
- Netlify
- GitHub Pages
- 任何支持静态文件的服务器

## 🌐 SEKAI 生态

本项目是 **SEKAI 生态**的核心门户。

查看完整的项目列表和架构: **[SEKAI Hub](https://hub.nightcord.de5.net)**

### 生态项目

- **[SEKAI Pass](https://id.nightcord.de5.net)** - SSO 认证系统
- **[Nightcord](https://nightcord.de5.net)** - 即时通讯平台
- **[25時作業風景](https://25ji-sagyo.nightcord.de5.net)** - 沉浸式学习工具
- **[Nako API](https://nako.nightcord.de5.net)** - AI 机器人 API
- **[pjsekai](https://pjsekai.nightcord.de5.net)** - CDN & API 网关

## 🤝 贡献

欢迎贡献! 我们非常感谢任何形式的贡献。

在贡献之前，请阅读:
- [贡献指南](./CONTRIBUTING.md)
- [行为准则](./CODE_OF_CONDUCT.md)

### 快速贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 🔒 安全

如果发现安全漏洞，请查看我们的 [安全政策](./SECURITY.md)。

对于 OAuth 相关的安全问题，请特别注意 PKCE 流程和 Token 存储安全。

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。

## 📧 联系方式

- **GitHub Issues**: [https://github.com/25-ji-code-de/hub/issues](https://github.com/25-ji-code-de/hub/issues)
- **项目主页**: [https://hub.nightcord.de5.net](https://hub.nightcord.de5.net)
- **哔哩哔哩**: [@bili_47177171806](https://space.bilibili.com/3546904856103196)

## 🙏 致谢

- 感谢所有贡献者
- 感谢 SEKAI 生态系统的所有项目维护者
- 特别感谢使用和支持 SEKAI 生态的用户

## ⭐ Star History

如果这个项目对你有帮助，请给我们一个 Star!

[![Star History Chart](https://api.star-history.com/svg?repos=25-ji-code-de/hub&type=Date)](https://star-history.com/#25-ji-code-de/hub&Date)

---

<div align="center">

**[SEKAI 生态](https://hub.nightcord.de5.net)** 的核心门户

Made with 💜 by the [25-ji-code-de](https://github.com/25-ji-code-de) team

</div>
