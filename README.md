# ChatGPT 长对话助手

ChatGPT 长对话助手是一个免费、轻量、纯中文的 Chrome / Edge Manifest V3 浏览器扩展，用来整理 ChatGPT 网页版长对话。

这个仓库现在包含完整扩展源码、隐私政策页面、商店宣传素材和本地安装说明。仓库根目录就是扩展根目录，可以直接在浏览器开发者模式中加载。

## 核心定位

ChatGPT 官方已经改善了长对话卡顿问题，但长对话依然存在回看困难、重点难找、内容整理麻烦的问题。本扩展的定位是“长对话阅读与整理助手”：

- 让长对话更容易导航。
- 让重要消息更容易标记和回看。
- 让局部问答更容易复制。
- 让已标记或当前可见内容更容易导出为 Markdown。
- 在必要时继续通过收起较早消息和长用户输入来减轻页面负担。

扩展只在浏览器本地处理 ChatGPT 页面 DOM，不拦截网络请求，不改写 ChatGPT 接口响应，不上传聊天内容。

## 已实现功能

- 长对话目录：自动生成对话 turn 列表，支持用户 / ChatGPT / 全部筛选。
- 目录搜索：在目录中搜索历史对话文本、附件名称和备注。
- 点击跳转：点击目录或标记项后跳转到对应 turn。
- 本地标记：给某条消息添加或取消标记。
- 本地备注：给某条消息添加简短备注，备注只保存在浏览器 storage。
- 复制本轮：在 ChatGPT 回复下复制当前用户问题和对应 ChatGPT 回复为 Markdown。
- 阅读过滤：切换全部、只看用户、只看 ChatGPT、只看标记。
- 导出整理：预览并复制已标记内容或当前可见内容的 Markdown。
- 附件识别：用户只发送图片或文件时，目录和 Markdown 会显示文件类型或文件名。
- 较早消息收起：长对话超过保留数量后，将较早 turn 收起为轻量占位块。
- 向上滚动恢复：向上滚动时可逐步恢复旧消息。
- 长用户消息收起：自动收起超长 prompt、代码、日志和资料文本。
- 当前会话独立设置：可为当前对话保存独立配置。
- 中文悬浮面板：右下角提供轻量悬浮入口和设置卡片。
- Popup：扩展图标弹窗支持打开 ChatGPT、暂停 / 恢复、重置默认设置。
- 快捷键：支持打开面板、显示更早、全部展开、最小化入口。

## 技术特点

- Manifest V3。
- 原生 JavaScript + CSS + HTML。
- 不使用 React / Vue / 打包器。
- 不使用远程脚本、外部 CDN、analytics 或 tracking。
- 不请求 `<all_urls>`。
- 仅请求 `storage` 权限。
- 仅在 `https://chatgpt.com/*` 和 `https://chat.openai.com/*` 运行。
- UI 使用 Shadow DOM 隔离，减少对 ChatGPT 页面样式的污染。
- 不删除 ChatGPT 原始 DOM 节点，不破坏 React 组件树。

## 项目结构

```text
.
├─ manifest.json
├─ index.html
├─ privacy.md
├─ README.md
├─ _locales/
│  └─ zh_CN/
│     └─ messages.json
├─ icons/
│  ├─ icon16.png
│  ├─ icon48.png
│  └─ icon128.png
├─ src/
│  ├─ shared/
│  │  └─ defaults.js
│  ├─ content/
│  │  ├─ content.js
│  │  ├─ scanner.js
│  │  ├─ conversation.js
│  │  ├─ visibility.js
│  │  ├─ long-message.js
│  │  ├─ scroll-reveal.js
│  │  ├─ ui.js
│  │  ├─ storage.js
│  │  └─ content.css
│  └─ popup/
│     ├─ popup.html
│     ├─ popup.js
│     └─ popup.css
└─ store-assets/
   ├─ small-promo-tile-440x280.png
   ├─ large-promo-tile-1400x560.png
   └─ screenshots/
```

说明：

- `manifest.json` 是扩展清单文件。
- `index.html` 是 GitHub Pages 隐私政策网页。
- `privacy.md` 是 Markdown 版本隐私说明。
- `store-assets/` 是商店上架素材，不需要放入扩展上传包。

## 主要模块

- `src/content/scanner.js`：扫描 ChatGPT 页面中的对话 turn，并识别用户 / ChatGPT 角色。
- `src/content/conversation.js`：生成目录、处理标记、备注、附件识别、复制和导出 Markdown。
- `src/content/visibility.js`：处理旧消息收起、展开和视口稳定。
- `src/content/scroll-reveal.js`：监听滚动，处理向上滚动恢复旧消息。
- `src/content/long-message.js`：处理超长用户消息自动收起。
- `src/content/ui.js`：创建 Shadow DOM 悬浮入口和设置卡片。
- `src/content/storage.js`：读写 `chrome.storage.sync`，并在不支持时回退到 `chrome.storage.local`。
- `src/content/content.js`：content script 总入口，协调扫描、UI、存储、过滤和导出。
- `src/popup/`：浏览器工具栏 popup。
- `src/shared/defaults.js`：默认配置和配置规范化。

## 本地安装

### Microsoft Edge

1. 打开 `edge://extensions/`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择本仓库根目录。
5. 打开或刷新 `https://chatgpt.com/`。
6. 页面右下角出现“长对话助手”悬浮入口后即可使用。

### Google Chrome

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本仓库根目录。
5. 打开或刷新 `https://chatgpt.com/`。

## 打包上传

商店上传包只需要包含扩展运行必需文件，不需要包含 `.git`、`store-assets` 或已生成的 zip。

在仓库根目录执行：

```powershell
$zip = Join-Path (Get-Location) "chatgpt-long-chat-assistant-cn.zip"
if (Test-Path $zip) { Remove-Item -LiteralPath $zip }
$paths = @(
  "manifest.json",
  "_locales",
  "icons",
  "src",
  "README.md",
  "privacy.md"
)
Compress-Archive -Path $paths -DestinationPath $zip -CompressionLevel Optimal
```

生成的 `chatgpt-long-chat-assistant-cn.zip` 可用于 Microsoft Edge Add-ons 或 Chrome Web Store 上传。

## 隐私政策页面

GitHub Pages 隐私政策页面：

```text
https://johnnycn1213.github.io/chatgpt-long-chat-assistant-cn-privacy/
```

这个 URL 可填写到 Microsoft Edge Add-ons 或 Chrome Web Store 的隐私政策 URL 字段。

## 默认配置

```js
{
  enabled: true,
  keepCount: 8,
  autoReveal: true,
  revealStep: 2,
  collapseLongUserMessage: true,
  longMessageHeightThreshold: 280,
  longMessageCollapsedHeight: 180,
  panelOpen: false,
  theme: "auto",
  viewMode: "all",
  minimized: false,
  placeholderDensity: "normal",
  conversationData: {}
}
```

## 权限说明

```json
{
  "permissions": ["storage"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*"
  ]
}
```

- `storage`：保存用户设置、标记状态和用户手动输入的备注。
- `chatgpt.com` / `chat.openai.com`：在 ChatGPT 页面运行 content script。

扩展不会访问其他网站，不请求 `<all_urls>`。

## 开发检查

修改 JS 后可以执行：

```powershell
$files = Get-ChildItem -Path .\src -Recurse -File -Filter *.js
foreach ($file in $files) { node --check $file.FullName }

node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); JSON.parse(require('fs').readFileSync('_locales/zh_CN/messages.json','utf8')); console.log('json ok')"
```

## 使用限制

- 扩展依赖 ChatGPT 页面中的 DOM 特征，例如 `data-turn-id`、`data-testid^="conversation-turn-"` 和 `data-message-author-role`。
- 如果 ChatGPT 页面结构大幅调整，turn 扫描或按钮贴合位置可能需要更新。
- 扩展不会读取 ChatGPT 后端接口，也不会尝试解析完整 conversation JSON。

## 隐私承诺

- 不上传聊天内容。
- 不保存聊天正文。
- 不使用服务器。
- 不使用 analytics、tracking 或广告服务。
- 不加载远程脚本。
- 不读取 ChatGPT 以外的网站。
- 设置、标记和备注只保存在浏览器本地或浏览器同步存储中。
