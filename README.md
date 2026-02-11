# SEKAI Hub

SEKAI 生态系统的统一门户和用户中心。

## 🎯 定位

SEKAI Hub 是 SEKAI 生态系统的统一门户，提供：
1. **生态门户**（公开访问）- 展示所有项目、架构图和文档
2. **用户中心**（登录后）- 跨项目数据看板和快速入口

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

## 项目结构

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

## 本地开发

由于使用了 ES Modules 和 OAuth 跳转，你需要一个本地服务器来运行此项目。

可以使用 Python 快速启动：

```bash
python3 -m http.server 8000
```

然后访问: `http://localhost:8000`

注意：你需要确保 OAuth 提供方 (`id.nightcord.de5.net`) 允许 `http://localhost:8000/callback` 作为回调地址。如果遇到 CORS 或回调错误，可能是由于 Client ID 配置限制。

## 部署 (Cloudflare Pages)

1. 将代码推送到 Git 仓库。
2. 在 Cloudflare Pages 创建新项目。
3. 构建设置：
   - 框架预设: None
   - 构建命令: (空)
   - 输出目录: (空, 或 `.`)

## 配置

在 `assets/js/config.js` 中修改 OAuth 配置。

```javascript
export const CONFIG = {
    clientId: 'sekai_hub_client',
    // ...
};
```
