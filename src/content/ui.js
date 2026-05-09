(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});

  const uiState = {
    host: null,
    shadow: null,
    mounted: false,
    eventsBound: false,
    panelOpen: false,
    activeTab: "settings",
    exportText: "",
    outlineRole: "all",
    marksRole: "all",
    outlineQuery: "",
    marksQuery: ""
  };

  function icon() {
    return `
      <svg class="cnlco-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 6.7c0-1.2 1-2.2 2.2-2.2h8.6c1.2 0 2.2 1 2.2 2.2v6.2c0 1.2-1 2.2-2.2 2.2H11l-3.5 3.1v-3.1c-1.1-.1-2-1-2-2.2V6.7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M8.7 8.3h6.6M8.7 11.2h4.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `;
  }

  function getStyles() {
    return `
      :host {
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .cnlco-root {
        position: fixed;
        right: 24px;
        bottom: 88px;
        z-index: 2147483000;
        color: #0d0d0d;
        --cnlco-surface: #ffffff;
        --cnlco-surface-strong: #ffffff;
        --cnlco-surface-muted: #f7f7f8;
        --cnlco-control: #f4f4f4;
        --cnlco-control-hover: #ececec;
        --cnlco-border: #e3e3e3;
        --cnlco-text: #0d0d0d;
        --cnlco-muted: #6b6b6b;
        --cnlco-accent: #10a37f;
        --cnlco-accent-soft: #e7f4ef;
        --cnlco-primary: #0d0d0d;
        --cnlco-primary-text: #ffffff;
        --cnlco-danger: #b42318;
        --cnlco-scrollbar-thumb: rgba(13, 13, 13, 0.2);
        --cnlco-scrollbar-thumb-hover: rgba(13, 13, 13, 0.3);
        --cnlco-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
      }

      @media (prefers-color-scheme: dark) {
        .cnlco-root {
          color: #ececec;
          --cnlco-surface: #212121;
          --cnlco-surface-strong: #2f2f2f;
          --cnlco-surface-muted: #171717;
          --cnlco-control: #3a3a3a;
          --cnlco-control-hover: #444444;
          --cnlco-border: rgba(255, 255, 255, 0.14);
          --cnlco-text: #ececec;
          --cnlco-muted: #b4b4b4;
          --cnlco-accent: #10a37f;
          --cnlco-accent-soft: rgba(16, 163, 127, 0.18);
          --cnlco-primary: #ececec;
          --cnlco-primary-text: #0d0d0d;
          --cnlco-danger: #ff6b62;
          --cnlco-scrollbar-thumb: rgba(236, 236, 236, 0.18);
          --cnlco-scrollbar-thumb-hover: rgba(236, 236, 236, 0.28);
          --cnlco-shadow: 0 16px 42px rgba(0, 0, 0, 0.38);
        }
      }

      button,
      input,
      select,
      textarea {
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      .cnlco-pill {
        height: 36px;
        min-width: 140px;
        padding: 0 14px 0 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 1px solid var(--cnlco-border);
        border-radius: 999px;
        background: var(--cnlco-surface-strong);
        color: var(--cnlco-text);
        box-shadow: var(--cnlco-shadow);
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        transition: transform 160ms ease, background 160ms ease, width 160ms ease;
      }

      .cnlco-pill:hover {
        transform: translateY(-1px);
        background: var(--cnlco-control);
      }

      .cnlco-root[data-minimized="true"] .cnlco-pill {
        min-width: 44px;
        width: 44px;
        padding: 0;
      }

      .cnlco-pill-restore {
        display: none;
        font-size: 20px;
        font-weight: 650;
        line-height: 1;
      }

      .cnlco-root[data-minimized="true"] .cnlco-pill-text {
        display: none;
      }

      .cnlco-icon {
        width: 16px;
        height: 16px;
        color: var(--cnlco-text);
        flex: 0 0 auto;
      }

      .cnlco-card {
        position: absolute;
        right: 0;
        bottom: 48px;
        width: 360px;
        max-height: min(680px, calc(100vh - 124px));
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        padding: 14px 12px 12px;
        border: 1px solid var(--cnlco-border);
        border-radius: 16px;
        background: var(--cnlco-surface-strong);
        color: var(--cnlco-text);
        box-shadow: var(--cnlco-shadow);
      }

      .cnlco-card[hidden] {
        display: none;
      }

      .cnlco-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .cnlco-title {
        margin: 0;
        font-size: 15px;
        font-weight: 780;
        letter-spacing: 0;
      }

      .cnlco-subtitle {
        margin: 4px 0 0;
        color: var(--cnlco-muted);
        font-size: 12px;
        line-height: 1.45;
      }

      .cnlco-icon-button {
        width: 30px;
        height: 30px;
        border: 1px solid var(--cnlco-border);
        border-radius: 999px;
        background: var(--cnlco-control);
        color: var(--cnlco-text);
        font-size: 15px;
        font-weight: 800;
      }

      .cnlco-minimize-button {
        width: auto;
        min-width: 124px;
        padding: 0 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 12px;
        font-weight: 720;
        white-space: nowrap;
      }

      .cnlco-minimize-symbol {
        font-size: 15px;
        font-weight: 800;
        line-height: 1;
      }

      .cnlco-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }

      .cnlco-stat {
        border: 1px solid var(--cnlco-border);
        border-radius: 12px;
        padding: 9px 8px;
        background: var(--cnlco-surface-muted);
      }

      .cnlco-stat-value {
        display: block;
        font-size: 16px;
        font-weight: 780;
      }

      .cnlco-stat-label {
        display: block;
        margin-top: 3px;
        color: var(--cnlco-muted);
        font-size: 11px;
      }

      .cnlco-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        margin-bottom: 12px;
        padding: 4px;
        border: 1px solid var(--cnlco-border);
        border-radius: 13px;
        background: var(--cnlco-control);
      }

      .cnlco-tabs button,
      .cnlco-segment button,
      .cnlco-action,
      .cnlco-list-button {
        appearance: none;
        border: 0;
        font: inherit;
      }

      .cnlco-tabs button,
      .cnlco-segment button {
        min-height: 28px;
        border-radius: 9px;
        color: var(--cnlco-muted);
        background: transparent;
        font-size: 12px;
        font-weight: 720;
      }

      .cnlco-tabs button[aria-selected="true"],
      .cnlco-segment button[aria-pressed="true"] {
        color: var(--cnlco-text);
        background: var(--cnlco-surface-strong);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      }

      .cnlco-body {
        overflow-y: auto;
        overflow-x: hidden;
        margin-right: -10px;
        padding-right: 6px;
        scrollbar-gutter: stable;
        scrollbar-width: thin;
        scrollbar-color: var(--cnlco-scrollbar-thumb) transparent;
      }

      .cnlco-body::-webkit-scrollbar {
        width: 10px;
      }

      .cnlco-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .cnlco-body::-webkit-scrollbar-thumb {
        border: 3px solid transparent;
        border-radius: 999px;
        background: var(--cnlco-scrollbar-thumb);
        background-clip: content-box;
      }

      .cnlco-body::-webkit-scrollbar-thumb:hover {
        background: var(--cnlco-scrollbar-thumb-hover);
        background-clip: content-box;
      }

      .cnlco-body::-webkit-scrollbar-button {
        width: 0;
        height: 0;
        display: none;
      }

      .cnlco-panel[hidden] {
        display: none;
      }

      .cnlco-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 0;
        border-top: 1px solid var(--cnlco-border);
      }

      .cnlco-row[hidden] {
        display: none;
      }

      .cnlco-row:first-child {
        border-top: none;
      }

      .cnlco-label {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .cnlco-label-main {
        font-size: 13px;
        font-weight: 680;
      }

      .cnlco-label-sub {
        color: var(--cnlco-muted);
        font-size: 11px;
        line-height: 1.35;
      }

      .cnlco-switch {
        width: 46px;
        height: 26px;
        flex: 0 0 auto;
        border: 1px solid var(--cnlco-border);
        border-radius: 999px;
        padding: 2px;
        background: var(--cnlco-control);
      }

      .cnlco-switch::before {
        content: "";
        display: block;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
        transition: transform 160ms ease;
      }

      .cnlco-switch[aria-pressed="true"] {
        background: var(--cnlco-accent);
        border-color: transparent;
      }

      .cnlco-switch[aria-pressed="true"]::before {
        transform: translateX(20px);
      }

      .cnlco-segment {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        width: 178px;
        padding: 4px;
        border: 1px solid var(--cnlco-border);
        border-radius: 12px;
        background: var(--cnlco-control);
      }

      .cnlco-field {
        width: 86px;
        height: 32px;
        border: 1px solid var(--cnlco-border);
        border-radius: 10px;
        padding: 0 9px;
        color: var(--cnlco-text);
        background: var(--cnlco-surface-muted);
        outline: none;
      }

      .cnlco-field[data-setting="viewMode"] {
        width: 148px;
        padding-left: 10px;
        padding-right: 28px;
        text-align: left;
        text-align-last: left;
      }

      .cnlco-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 12px;
      }

      .cnlco-action {
        min-height: 34px;
        border-radius: 11px;
        color: var(--cnlco-text);
        background: var(--cnlco-control);
        font-size: 12px;
        font-weight: 730;
      }

      .cnlco-action-primary {
        color: var(--cnlco-primary-text);
        background: var(--cnlco-primary);
      }

      .cnlco-action-danger {
        color: var(--cnlco-danger);
      }

      .cnlco-section-title {
        margin: 10px 0 8px;
        color: var(--cnlco-muted);
        font-size: 12px;
        font-weight: 720;
      }

      .cnlco-list-controls {
        display: grid;
        gap: 8px;
        margin: 8px 0 10px;
      }

      .cnlco-role-filter {
        width: 100%;
        box-sizing: border-box;
        grid-template-columns: repeat(3, 1fr);
      }

      .cnlco-search {
        width: 100%;
        height: 34px;
        box-sizing: border-box;
        border: 1px solid var(--cnlco-border);
        border-radius: 12px;
        padding: 0 11px;
        color: var(--cnlco-text);
        background: var(--cnlco-surface-muted);
        outline: none;
      }

      .cnlco-search:focus {
        border-color: color-mix(in srgb, var(--cnlco-text) 36%, var(--cnlco-border));
      }

      .cnlco-list {
        min-width: 0;
        max-width: 100%;
        display: grid;
        gap: 6px;
        overflow-x: hidden;
      }

      .cnlco-list-button {
        width: 100%;
        max-width: 100%;
        min-height: 38px;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr);
        gap: 8px;
        align-items: center;
        padding: 8px 8px;
        border-radius: 12px;
        color: var(--cnlco-text);
        background: var(--cnlco-surface-muted);
        text-align: left;
        overflow: hidden;
      }

      .cnlco-list-button:hover {
        background: var(--cnlco-control-hover);
      }

      .cnlco-list-index {
        width: auto;
        min-width: max-content;
        overflow: hidden;
        text-overflow: clip;
        white-space: nowrap;
        color: var(--cnlco-muted);
        font-size: 11px;
        font-weight: 780;
        font-variant-numeric: tabular-nums;
      }

      .cnlco-list-index[data-role="user"] {
        color: var(--cnlco-text);
      }

      .cnlco-list-index[data-role="assistant"] {
        color: var(--cnlco-accent);
      }

      .cnlco-list-main {
        min-width: 0;
        overflow: hidden;
      }

      .cnlco-list-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 680;
      }

      .cnlco-list-note {
        margin-top: 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--cnlco-muted);
        font-size: 11px;
      }

      .cnlco-empty {
        padding: 14px 10px;
        border: 1px dashed var(--cnlco-border);
        border-radius: 12px;
        color: var(--cnlco-muted);
        font-size: 12px;
        text-align: center;
      }

      .cnlco-privacy,
      .cnlco-shortcuts {
        margin-top: 12px;
        color: var(--cnlco-muted);
        font-size: 11px;
        line-height: 1.45;
      }

      .cnlco-preview {
        position: fixed;
        inset: auto 24px 24px auto;
        width: min(560px, calc(100vw - 48px));
        max-height: min(680px, calc(100vh - 48px));
        z-index: 2147483001;
        display: grid;
        gap: 10px;
        padding: 14px;
        border: 1px solid var(--cnlco-border);
        border-radius: 16px;
        background: var(--cnlco-surface-strong);
        color: var(--cnlco-text);
        box-shadow: var(--cnlco-shadow);
      }

      .cnlco-preview[hidden] {
        display: none;
      }

      .cnlco-preview textarea {
        width: 100%;
        height: min(420px, 50vh);
        resize: vertical;
        border: 1px solid var(--cnlco-border);
        border-radius: 12px;
        padding: 10px;
        color: var(--cnlco-text);
        background: var(--cnlco-surface-muted);
        font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.5;
      }

      .cnlco-toast {
        position: absolute;
        right: 0;
        bottom: -42px;
        padding: 9px 12px;
        border: 1px solid var(--cnlco-border);
        border-radius: 999px;
        background: var(--cnlco-surface-strong);
        box-shadow: var(--cnlco-shadow);
        color: var(--cnlco-text);
        font-size: 12px;
      }

      .cnlco-toast[hidden] {
        display: none;
      }

      @media (max-width: 700px) {
        .cnlco-root {
          right: 12px;
          bottom: 74px;
        }

        .cnlco-card {
          width: min(340px, calc(100vw - 24px));
          max-height: min(660px, calc(100vh - 104px));
        }
      }
    `;
  }

  function getMarkup() {
    return `
      <div class="cnlco-root" data-open="false" data-minimized="false">
          <button class="cnlco-pill" type="button" aria-expanded="false" aria-label="打开 ChatGPT 长对话助手">
            ${icon()}
            <span class="cnlco-pill-text">长对话助手 · 8</span>
          </button>

        <section class="cnlco-card" hidden aria-label="ChatGPT 长对话助手面板">
          <header class="cnlco-header">
            <div>
              <h2 class="cnlco-title">ChatGPT 长对话助手</h2>
              <p class="cnlco-subtitle">目录、标记、备注和批量导出</p>
            </div>
            <button class="cnlco-icon-button cnlco-minimize-button" type="button" data-action="minimize" aria-label="最小化悬浮窗" title="最小化悬浮窗">
              <span class="cnlco-minimize-symbol" aria-hidden="true">−</span>
              <span class="cnlco-minimize-label">最小化悬浮窗</span>
            </button>
          </header>

          <div class="cnlco-stats" aria-label="当前对话状态">
            <div class="cnlco-stat">
              <span class="cnlco-stat-value" data-field="total">0</span>
              <span class="cnlco-stat-label">总 turn</span>
            </div>
            <div class="cnlco-stat">
              <span class="cnlco-stat-value" data-field="visible">0</span>
              <span class="cnlco-stat-label">完整显示</span>
            </div>
            <div class="cnlco-stat">
              <span class="cnlco-stat-value" data-field="collapsed">0</span>
              <span class="cnlco-stat-label">已收起</span>
            </div>
          </div>

          <nav class="cnlco-tabs" aria-label="长对话助手功能">
            <button type="button" data-tab="settings" aria-selected="true">设置</button>
            <button type="button" data-tab="outline" aria-selected="false">目录</button>
            <button type="button" data-tab="marks" aria-selected="false">标记</button>
            <button type="button" data-tab="export" aria-selected="false">导出</button>
          </nav>

          <div class="cnlco-body">
            <section class="cnlco-panel" data-panel="settings">
              <div class="cnlco-row">
                <div class="cnlco-label">
                  <span class="cnlco-label-main">启用助手</span>
                  <span class="cnlco-label-sub">暂停后会恢复所有消息</span>
                </div>
                <button class="cnlco-switch" type="button" data-action="toggle-enabled" aria-pressed="true" aria-label="启用助手"></button>
              </div>

              <div class="cnlco-row">
                <div class="cnlco-label">
                  <span class="cnlco-label-main">保留最近消息</span>
                  <span class="cnlco-label-sub">超过数量后收起更早 turn</span>
                </div>
                <div class="cnlco-segment" role="group" aria-label="保留最近消息数量">
                  <button type="button" data-keep="5">5</button>
                  <button type="button" data-keep="8">8</button>
                  <button type="button" data-keep="12">12</button>
                  <button type="button" data-keep="20">20</button>
                </div>
              </div>

              <div class="cnlco-row">
                <div class="cnlco-label">
                  <span class="cnlco-label-main">阅读过滤</span>
                  <span class="cnlco-label-sub">切换当前页面显示范围</span>
                </div>
                <select class="cnlco-field" data-setting="viewMode" aria-label="阅读过滤模式">
                  <option value="all">全部</option>
                  <option value="user">只看用户</option>
                  <option value="assistant">只看 ChatGPT</option>
                  <option value="bookmarked">只看标记</option>
                </select>
              </div>

              <div class="cnlco-row">
                <div class="cnlco-label">
                  <span class="cnlco-label-main">向上滚动自动显示旧消息</span>
                  <span class="cnlco-label-sub">接近顶部时逐步展开</span>
                </div>
                <button class="cnlco-switch" type="button" data-action="toggle-auto" aria-pressed="true" aria-label="向上滚动自动显示旧消息"></button>
              </div>

              <div class="cnlco-row">
                <div class="cnlco-label">
                  <span class="cnlco-label-main">每次显示条数</span>
                  <span class="cnlco-label-sub">向上滚动或手动显示更早时使用</span>
                </div>
                <input class="cnlco-field" type="number" min="1" max="8" step="1" data-setting="revealStep" aria-label="每次显示条数">
              </div>

              <div class="cnlco-row">
                <div class="cnlco-label">
                  <span class="cnlco-label-main">长用户消息自动收起</span>
                  <span class="cnlco-label-sub">适合长 prompt、代码和日志</span>
                </div>
                <button class="cnlco-switch" type="button" data-action="toggle-long" aria-pressed="true" aria-label="长用户消息自动收起"></button>
              </div>

              <div class="cnlco-row" data-long-message-option>
                <div class="cnlco-label">
                  <span class="cnlco-label-main">长消息阈值</span>
                  <span class="cnlco-label-sub">超过该高度后自动收起</span>
                </div>
                <input class="cnlco-field" type="number" min="160" max="1200" step="20" data-setting="longMessageHeightThreshold" aria-label="长消息阈值">
              </div>

              <div class="cnlco-row">
                <div class="cnlco-label">
                  <span class="cnlco-label-main">占位块密度</span>
                  <span class="cnlco-label-sub">控制收起后占位块高度</span>
                </div>
                <select class="cnlco-field" data-setting="placeholderDensity" aria-label="占位块密度">
                  <option value="compact">紧凑</option>
                  <option value="normal">标准</option>
                  <option value="comfortable">舒展</option>
                </select>
              </div>

              <div class="cnlco-actions">
                <button class="cnlco-action cnlco-action-primary" type="button" data-action="show-earlier">显示更早</button>
                <button class="cnlco-action" type="button" data-action="expand-all">全部展开</button>
                <button class="cnlco-action" type="button" data-action="view-all">恢复完整视图</button>
                <button class="cnlco-action" type="button" data-action="export-visible">导出可见</button>
                <button class="cnlco-action" type="button" data-action="save-conversation">保存为本会话设置</button>
                <button class="cnlco-action cnlco-action-danger" type="button" data-action="clear-conversation">清除本会话设置</button>
              </div>

              <div class="cnlco-privacy" data-field="override-state">本会话设置：未启用</div>

              <div class="cnlco-shortcuts">快捷键：Alt+Shift+L 打开面板，Alt+Shift+R 显示更早，Alt+Shift+E 全部展开，Alt+Shift+M 最小化。</div>
            </section>

            <section class="cnlco-panel" data-panel="outline" hidden>
              <div class="cnlco-section-title" data-field="outline-title">长对话目录</div>
              <div class="cnlco-list-controls">
                <div class="cnlco-segment cnlco-role-filter" role="group" aria-label="目录消息类型">
                  <button type="button" data-filter-scope="outline" data-role-filter="user">用户</button>
                  <button type="button" data-filter-scope="outline" data-role-filter="assistant">ChatGPT</button>
                  <button type="button" data-filter-scope="outline" data-role-filter="all">全部</button>
                </div>
                <input class="cnlco-search" type="search" data-search="outline" placeholder="搜索历史对话" aria-label="搜索目录历史对话">
              </div>
              <div class="cnlco-list" data-list="outline"></div>
            </section>

            <section class="cnlco-panel" data-panel="marks" hidden>
              <div class="cnlco-list-controls">
                <div class="cnlco-segment cnlco-role-filter" role="group" aria-label="标记消息类型">
                  <button type="button" data-filter-scope="marks" data-role-filter="user">用户</button>
                  <button type="button" data-filter-scope="marks" data-role-filter="assistant">ChatGPT</button>
                  <button type="button" data-filter-scope="marks" data-role-filter="all">全部</button>
                </div>
                <input class="cnlco-search" type="search" data-search="marks" placeholder="搜索历史对话" aria-label="搜索标记和备注历史对话">
              </div>
              <div class="cnlco-section-title">已标记列表</div>
              <div class="cnlco-list" data-list="bookmarks"></div>
              <div class="cnlco-section-title">本地备注</div>
              <div class="cnlco-list" data-list="notes"></div>
            </section>

            <section class="cnlco-panel" data-panel="export" hidden>
              <div class="cnlco-section-title">导出整理</div>
              <div class="cnlco-actions">
                <button class="cnlco-action cnlco-action-primary" type="button" data-action="export-marked">预览已标记内容</button>
                <button class="cnlco-action" type="button" data-action="export-visible">预览当前可见内容</button>
              </div>
              <div class="cnlco-privacy">导出预览只在本地生成，不上传聊天内容。</div>
            </section>
          </div>

          <div class="cnlco-privacy">仅在本地处理，不上传聊天内容</div>
        </section>

        <section class="cnlco-preview" hidden aria-label="导出预览">
          <header class="cnlco-header">
            <div>
              <h2 class="cnlco-title" data-field="preview-title">导出预览</h2>
              <p class="cnlco-subtitle">确认内容后再复制 Markdown</p>
            </div>
            <button class="cnlco-icon-button" type="button" data-action="close-preview" aria-label="关闭导出预览">×</button>
          </header>
          <textarea readonly data-field="preview-text"></textarea>
          <div class="cnlco-actions">
            <button class="cnlco-action cnlco-action-primary" type="button" data-action="copy-preview">复制 Markdown</button>
            <button class="cnlco-action" type="button" data-action="close-preview">关闭</button>
          </div>
        </section>

        <div class="cnlco-toast" hidden role="status"></div>
      </div>
    `;
  }

  function setPanelOpen(open, persist = true) {
    uiState.panelOpen = Boolean(open);

    const card = uiState.shadow?.querySelector(".cnlco-card");
    const pill = uiState.shadow?.querySelector(".cnlco-pill");
    const root = uiState.shadow?.querySelector(".cnlco-root");

    if (card) card.hidden = !uiState.panelOpen;
    if (pill) pill.setAttribute("aria-expanded", String(uiState.panelOpen));
    if (root) root.dataset.open = String(uiState.panelOpen);

    if (persist) {
      app.controller?.updateSettings({ panelOpen: uiState.panelOpen });
    }
  }

  function setActiveTab(tab) {
    uiState.activeTab = tab;

    uiState.shadow.querySelectorAll("[data-tab]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.tab === tab));
    });

    uiState.shadow.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab;
    });
  }

  function syncMinimizeControls(minimized) {
    const shadow = uiState.shadow;
    if (!shadow) return;

    const pill = shadow.querySelector(".cnlco-pill");
    const button = shadow.querySelector('[data-action="minimize"]');
    const symbol = button?.querySelector(".cnlco-minimize-symbol");
    const label = button?.querySelector(".cnlco-minimize-label");
    const isMinimized = Boolean(minimized);
    const buttonText = isMinimized ? "恢复默认悬浮窗" : "最小化悬浮窗";
    const buttonSymbol = isMinimized ? "+" : "−";
    const pillLabel = isMinimized
      ? "打开 ChatGPT 长对话助手菜单"
      : "打开 ChatGPT 长对话助手";

    if (pill) {
      pill.setAttribute("aria-label", pillLabel);
      pill.setAttribute("title", pillLabel);
    }

    if (button) {
      button.setAttribute("aria-label", buttonText);
      button.setAttribute("title", buttonText);
    }

    if (symbol) symbol.textContent = buttonSymbol;
    if (label) label.textContent = buttonText;
  }

  function setMinimized(minimized, options = {}) {
    const isMinimized = Boolean(minimized);
    const shouldClosePanel =
      Object.prototype.hasOwnProperty.call(options, "closePanel")
        ? Boolean(options.closePanel)
        : isMinimized;

    if (shouldClosePanel) {
      setPanelOpen(false, false);
    }

    const root = uiState.shadow?.querySelector(".cnlco-root");
    if (root) root.dataset.minimized = String(isMinimized);
    syncMinimizeControls(isMinimized);

    app.controller?.updateSettings({
      minimized: isMinimized,
      ...(shouldClosePanel ? { panelOpen: false } : {})
    });
  }

  function onDocumentPointerDown(event) {
    if (!uiState.panelOpen || !uiState.host) return;
    if (event.composedPath().includes(uiState.host)) return;
    setPanelOpen(false);
  }

  function onDocumentKeyDown(event) {
    if (event.key === "Escape") {
      closeExportPreview();
      if (uiState.panelOpen) setPanelOpen(false);
      return;
    }

    if (!event.altKey || !event.shiftKey) return;
      const key = event.key.toLowerCase();

      if (key === "l") {
        event.preventDefault();
        setMinimized(false, { closePanel: false });
        setPanelOpen(!uiState.panelOpen);
      }

    if (key === "r") {
      event.preventDefault();
      app.controller?.revealOlder();
    }

    if (key === "e") {
      event.preventDefault();
      app.controller?.expandAll();
    }

    if (key === "m") {
      event.preventDefault();
      const minimized =
        uiState.shadow?.querySelector(".cnlco-root")?.dataset.minimized === "true";
      setMinimized(!minimized);
    }
  }

  function handleSettingChange(target) {
    const key = target.dataset.setting;
    if (!key) return;

    let value = target.value;
    if (target.type === "number") value = Number(value);

    app.controller.updateSettings({ [key]: value });
  }

  function bindEvents() {
    if (uiState.eventsBound) return;
    uiState.eventsBound = true;

    const shadow = uiState.shadow;

    shadow.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;

      if (button.classList.contains("cnlco-pill")) {
        const minimized =
          uiState.shadow?.querySelector(".cnlco-root")?.dataset.minimized === "true";

        if (minimized) {
          setPanelOpen(!uiState.panelOpen);
          return;
        }

        setPanelOpen(!uiState.panelOpen);
        return;
      }

      if (button.dataset.tab) {
        setActiveTab(button.dataset.tab);
        return;
      }

      if (button.dataset.filterScope && button.dataset.roleFilter) {
        const scope = button.dataset.filterScope;
        if (scope === "marks") {
          uiState.marksRole = button.dataset.roleFilter;
        } else {
          uiState.outlineRole = button.dataset.roleFilter;
        }
        refreshFromCurrentState();
        return;
      }

      const action = button.dataset.action;
      if (!action) return;

      const actions = {
        "toggle-enabled": () =>
          app.controller.updateSettings({
            enabled: !app.state.settings.enabled
          }),
        "toggle-auto": () =>
          app.controller.updateSettings({
            autoReveal: !app.state.settings.autoReveal
          }),
        "toggle-long": () =>
          app.controller.updateSettings({
            collapseLongUserMessage:
              !app.state.settings.collapseLongUserMessage
          }),
        "show-earlier": () => app.controller.revealOlder(),
        "expand-all": () => app.controller.expandAll(),
        "view-all": () => app.controller.updateSettings({ viewMode: "all" }),
        "save-conversation": () => app.controller.saveConversationOverride(),
        "clear-conversation": () => app.controller.clearConversationOverride(),
        "export-marked": () => app.controller.exportMarked(),
        "export-visible": () => app.controller.exportVisible(),
        "copy-preview": () => app.controller.copyExportText(uiState.exportText),
        "close-preview": () => closeExportPreview(),
        minimize: () => {
          const minimized =
            uiState.shadow?.querySelector(".cnlco-root")?.dataset.minimized ===
            "true";
          if (minimized) {
            setMinimized(false, { closePanel: true });
            return;
          }

          setMinimized(true);
        }
      };

      actions[action]?.();
    });

    shadow.addEventListener("change", (event) => {
      if (event.target.matches("[data-setting]")) {
        handleSettingChange(event.target);
      }
    });

    shadow.addEventListener("input", (event) => {
      const input = event.target.closest("[data-search]");
      if (!input) return;

      if (input.dataset.search === "marks") {
        uiState.marksQuery = input.value;
      } else {
        uiState.outlineQuery = input.value;
      }

      refreshFromCurrentState();
    });

    shadow.addEventListener("click", (event) => {
      const item = event.target.closest("[data-jump-key]");
      if (!item) return;
      app.controller.jumpToTurnKey(item.dataset.jumpKey);
    });

    shadow.querySelectorAll("[data-keep]").forEach((button) => {
      button.addEventListener("click", () => {
        app.controller.updateSettings({
          keepCount: Number(button.dataset.keep)
        });
      });
    });

    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    document.addEventListener("keydown", onDocumentKeyDown, true);
  }

  function mount(settings) {
    if (uiState.mounted) return;

    const existingHost = document.getElementById("cnlco-shadow-host");
    const existingShadow = existingHost?.shadowRoot;

    if (existingShadow?.querySelector(".cnlco-root")) {
      uiState.host = existingHost;
      uiState.shadow = existingShadow;
      uiState.mounted = true;
      bindEvents();
      setPanelOpen(settings.panelOpen, false);
      return;
    }

    if (existingHost) existingHost.remove();

    const host = document.createElement("div");
    host.id = "cnlco-shadow-host";
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = getStyles();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = getMarkup();

    shadow.append(style, wrapper.firstElementChild);

    uiState.host = host;
    uiState.shadow = shadow;
    uiState.mounted = true;

    bindEvents();
    setActiveTab(uiState.activeTab);
    setPanelOpen(settings.panelOpen, false);
  }

  function getRoleText(role) {
    if (role === "user") return "用户";
    if (role === "assistant") return "ChatGPT";
    return "消息";
  }

  function formatListIndex(item) {
    const role = getRoleText(item.role);
    const gap = item.role === "user" ? "" : " ";
    return `${role}${gap}${item.number}/${item.total}`;
  }

  function normalizeQuery(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function getScopeState(scope) {
    if (scope === "marks") {
      return {
        role: uiState.marksRole,
        query: normalizeQuery(uiState.marksQuery)
      };
    }

    return {
      role: uiState.outlineRole,
      query: normalizeQuery(uiState.outlineQuery)
    };
  }

  function itemMatches(item, state) {
    if (state.role !== "all" && item.role !== state.role) return false;
    if (!state.query) return true;

    const haystack = `${item.title || ""} ${item.note || ""} ${
      item.searchText || ""
    }`.toLowerCase();

    return haystack.includes(state.query);
  }

  function filterItems(items, scope) {
    const state = getScopeState(scope);
    return (items || []).filter((item) => itemMatches(item, state));
  }

  function syncListControls(scope) {
    const shadow = uiState.shadow;
    const state = getScopeState(scope);

    shadow
      .querySelectorAll(`[data-filter-scope="${scope}"]`)
      .forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.roleFilter === state.role)
        );
      });

    const input = shadow.querySelector(`[data-search="${scope}"]`);
    if (input && shadow.activeElement !== input) {
      input.value = scope === "marks" ? uiState.marksQuery : uiState.outlineQuery;
    }
  }

  function refreshFromCurrentState() {
    app.ui.refresh(
      app.state?.settings,
      app.state?.latestStats,
      app.state?.viewModel
    );
  }

  function setList(listName, items, emptyText) {
    const list = uiState.shadow.querySelector(`[data-list="${listName}"]`);
    if (!list) return;

    list.replaceChildren();

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "cnlco-empty";
      empty.textContent = emptyText;
      list.appendChild(empty);
      return;
    }

    for (const item of items.slice(0, 80)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cnlco-list-button";
      button.dataset.jumpKey = item.key;

      const index = document.createElement("span");
      index.className = "cnlco-list-index";
      index.dataset.role = item.role || "unknown";
      index.textContent = formatListIndex(item);

      const main = document.createElement("span");
      main.className = "cnlco-list-main";

      const title = document.createElement("span");
      title.className = "cnlco-list-title";
      title.textContent = item.title;

      main.appendChild(title);

      if (item.note) {
        const note = document.createElement("span");
        note.className = "cnlco-list-note";
        note.textContent = `备注：${item.note}`;
        main.appendChild(note);
      }

      button.append(index, main);
      list.appendChild(button);
    }
  }

  function refresh(settings, stats, model) {
    if (!uiState.mounted) return;

    const shadow = uiState.shadow;
    const root = shadow.querySelector(".cnlco-root");
    const pillText = shadow.querySelector(".cnlco-pill-text");
    const enabledButton = shadow.querySelector('[data-action="toggle-enabled"]');
    const autoButton = shadow.querySelector('[data-action="toggle-auto"]');
    const longButton = shadow.querySelector('[data-action="toggle-long"]');

    root.dataset.minimized = String(Boolean(settings.minimized));
    syncMinimizeControls(Boolean(settings.minimized));
    pillText.textContent = settings.enabled
      ? `长对话助手 · ${settings.keepCount}`
      : "助手已暂停";

    enabledButton.setAttribute("aria-pressed", String(settings.enabled));
    autoButton.setAttribute("aria-pressed", String(settings.autoReveal));
    longButton.setAttribute(
      "aria-pressed",
      String(settings.collapseLongUserMessage)
    );

    shadow.querySelector('[data-field="total"]').textContent = String(
      stats?.total || 0
    );
    shadow.querySelector('[data-field="visible"]').textContent = String(
      stats?.visible || 0
    );
    shadow.querySelector('[data-field="collapsed"]').textContent = String(
      stats?.collapsed || 0
    );

    shadow.querySelectorAll("[data-keep]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.keep) === settings.keepCount)
      );
    });

    shadow.querySelector('[data-setting="viewMode"]').value = settings.viewMode;
    shadow.querySelector('[data-setting="revealStep"]').value = String(
      settings.revealStep
    );
    shadow.querySelector(
      '[data-setting="longMessageHeightThreshold"]'
    ).value = String(settings.longMessageHeightThreshold);

    const longMessageOption = shadow.querySelector("[data-long-message-option]");
    if (longMessageOption) {
      longMessageOption.hidden = !settings.collapseLongUserMessage;
    }

    shadow.querySelector('[data-setting="placeholderDensity"]').value =
      settings.placeholderDensity;

    syncListControls("outline");
    syncListControls("marks");

    const outlineItems = filterItems(model?.outline || [], "outline");
    const bookmarkItems = filterItems(model?.bookmarks || [], "marks");
    const noteItems = filterItems(model?.notes || [], "marks");

    const outlineTitle = shadow.querySelector('[data-field="outline-title"]');
    if (outlineTitle) {
      outlineTitle.textContent = `长对话目录 · ${outlineItems.length} 条消息`;
    }

    const overrideState = shadow.querySelector('[data-field="override-state"]');
    if (overrideState) {
      overrideState.textContent = model?.hasOverride
        ? "本会话设置：已启用"
        : "本会话设置：未启用";
    }

    setList("outline", outlineItems, "没有匹配的目录消息。");
    setList("bookmarks", bookmarkItems, "没有匹配的标记消息。");
    setList("notes", noteItems, "没有匹配的本地备注。");
  }

  function showExportPreview(title, text) {
    if (!uiState.mounted) return;

    uiState.exportText = text || "";
    const preview = uiState.shadow.querySelector(".cnlco-preview");
    preview.hidden = false;
    uiState.shadow.querySelector('[data-field="preview-title"]').textContent =
      title;
    uiState.shadow.querySelector('[data-field="preview-text"]').value =
      uiState.exportText;
  }

  function closeExportPreview() {
    const preview = uiState.shadow?.querySelector(".cnlco-preview");
    if (preview) preview.hidden = true;
  }

  function showToast(text) {
    const toast = uiState.shadow?.querySelector(".cnlco-toast");
    if (!toast) return;

    toast.textContent = text;
    toast.hidden = false;

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.hidden = true;
    }, 1600);
  }

  app.ui = {
    mount,
    refresh,
    showExportPreview,
    showToast
  };
})();
