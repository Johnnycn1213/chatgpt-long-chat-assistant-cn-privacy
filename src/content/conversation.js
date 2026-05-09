(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});
  const shared = window.CNLCOShared;

  const OVERRIDE_KEYS = [
    "enabled",
    "keepCount",
    "autoReveal",
    "revealStep",
    "collapseLongUserMessage",
    "longMessageHeightThreshold",
    "longMessageCollapsedHeight",
    "viewMode",
    "placeholderDensity"
  ];

  function getToolConfigForRole(role) {
    const base = [
      ["bookmark", "标记"],
      ["note", "备注"]
    ];

    if (role === "assistant") {
      return [...base, ["pair", "复制本轮"]];
    }

    return base;
  }

  function getConversationKey() {
    const path = location.pathname || "/";
    const match = path.match(/\/c\/([^/?#]+)/);
    if (match) return `conversation:${match[1]}`;
    return `page:${location.origin}${path}`;
  }

  function ensureRecord(settings, key = getConversationKey()) {
    const data = { ...(settings.conversationData || {}) };
    const current = data[key] && typeof data[key] === "object" ? data[key] : {};

    data[key] = {
      bookmarks:
        current.bookmarks && typeof current.bookmarks === "object"
          ? current.bookmarks
          : {},
      notes:
        current.notes && typeof current.notes === "object" ? current.notes : {},
      overrides:
        current.overrides && typeof current.overrides === "object"
          ? current.overrides
          : {}
    };

    return { data, record: data[key] };
  }

  function resolveSettings(settings, key = getConversationKey()) {
    const normalized = shared.normalizeSettings(settings);
    const { record } = ensureRecord(normalized, key);
    const override = {};

    for (const keyName of OVERRIDE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(record.overrides, keyName)) {
        override[keyName] = record.overrides[keyName];
      }
    }

    return {
      settings: shared.normalizeSettings({
        ...normalized,
        ...override,
        conversationData: normalized.conversationData
      }),
      hasOverride: Object.keys(override).length > 0,
      record
    };
  }

  function withConversationData(settings, key, updater) {
    const normalized = shared.normalizeSettings(settings);
    const { data, record } = ensureRecord(normalized, key);
    updater(record);

    return shared.normalizeSettings({
      ...normalized,
      conversationData: data
    });
  }

  function pickOverrides(settings) {
    const picked = {};
    for (const keyName of OVERRIDE_KEYS) {
      picked[keyName] = settings[keyName];
    }
    return picked;
  }

  function saveCurrentAsOverride(settings, key) {
    return withConversationData(settings, key, (record) => {
      record.overrides = pickOverrides(resolveSettings(settings, key).settings);
    });
  }

  function clearConversationOverride(settings, key) {
    return withConversationData(settings, key, (record) => {
      record.overrides = {};
    });
  }

  function updateConversationOverride(settings, key, partial) {
    return withConversationData(settings, key, (record) => {
      record.overrides = {
        ...record.overrides,
        ...partial
      };
    });
  }

  function getTurnKey(turn, index) {
    if (!turn || !(turn instanceof Element)) return `turn:${index}`;

    const turnId = turn.getAttribute("data-turn-id");
    if (turnId) return `turn-id:${turnId}`;

    const testId = turn.getAttribute("data-testid");
    if (testId) return `test-id:${testId}`;

    const role = app.scanner.detectTurnRole(turn);
    return `position:${role}:${index}`;
  }

  function cleanText(text, limit = 220) {
    const value = String(text || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!value) return "";
    if (value.length <= limit) return value;
    return `${value.slice(0, limit - 1)}…`;
  }

  const FILE_TYPE_LABELS = {
    pdf: "PDF",
    doc: "Word",
    docx: "Word",
    ppt: "PPT",
    pptx: "PPT",
    xls: "Excel",
    xlsx: "Excel",
    csv: "CSV",
    txt: "文本",
    md: "Markdown",
    zip: "压缩包",
    rar: "压缩包",
    "7z": "压缩包",
    png: "图片",
    jpg: "图片",
    jpeg: "图片",
    webp: "图片",
    gif: "图片",
    svg: "图片",
    mp4: "视频",
    mov: "视频",
    webm: "视频",
    mp3: "音频",
    wav: "音频"
  };

  const FILE_NAME_PATTERN =
    /[^\s"'<>:：|\\\/]+(?:[ _.\-()[\]\p{L}\p{N}])*?\.(?:pdf|docx?|pptx?|xlsx?|csv|txt|md|zip|rar|7z|png|jpe?g|webp|gif|svg|mp4|mov|webm|mp3|wav)/giu;

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeAttachmentName(value) {
    const text = cleanText(value, 140)
      .replace(/^(附件|文件|图片|图像|上传的文件|uploaded file)\s*[:：]?\s*/i, "")
      .trim();

    if (/^(image|uploaded image|图片|图像)$/i.test(text)) return "";
    return text;
  }

  function inferAttachmentType(label, fallback = "") {
    const source = `${label || ""} ${fallback || ""}`;
    const ext = source.match(/\.([a-z0-9]{1,8})(?:$|[?#\s)）\]])/i)?.[1];
    if (ext && FILE_TYPE_LABELS[ext.toLowerCase()]) {
      return FILE_TYPE_LABELS[ext.toLowerCase()];
    }

    const type = source.match(/\b(PDF|DOCX?|PPTX?|XLSX?|CSV|TXT|MD|ZIP|RAR|7Z|PNG|JPE?G|WEBP|GIF|SVG|MP4|MOV|WEBM|MP3|WAV)\b/i)?.[1];
    if (!type) return "";
    return FILE_TYPE_LABELS[type.toLowerCase()] || type.toUpperCase();
  }

  function addAttachment(items, attachment) {
    const label = normalizeAttachmentName(attachment.label);
    const type = attachment.type || inferAttachmentType(label, attachment.fallback);
    const kind = attachment.kind || (type === "图片" ? "image" : "file");
    const key = `${kind}:${type}:${label}`.toLowerCase();

    if (!label && !type && kind !== "image") return;
    if (!label && items.some((item) => item.kind === kind && item.type === type && item.label)) return;
    if (label) {
      const genericIndex = items.findIndex(
        (item) => item.kind === kind && item.type === type && !item.label
      );
      if (genericIndex >= 0) items.splice(genericIndex, 1);
    }
    if (items.some((item) => item.key === key)) return;

    items.push({ key, kind, label, type });
  }

  function getAttachmentSource(element) {
    return [
      element.getAttribute?.("download"),
      element.getAttribute?.("aria-label"),
      element.getAttribute?.("title"),
      element.getAttribute?.("alt"),
      element.textContent
    ]
      .filter(Boolean)
      .join(" ");
  }

  function getTurnAttachments(turn) {
    if (!turn) return [];

    const role = app.scanner.detectTurnRole(turn);
    const scope = getRoleRoot(turn, role) || turn;
    const items = [];
    const sourceText = getAttachmentSource(scope);

    for (const match of sourceText.matchAll(FILE_NAME_PATTERN)) {
      const label = normalizeAttachmentName(match[0]);
      addAttachment(items, {
        kind: inferAttachmentType(label) === "图片" ? "image" : "file",
        label,
        type: inferAttachmentType(label)
      });
    }

    scope.querySelectorAll("img, picture, canvas, video").forEach((element) => {
      if (element.closest(".cnlco-turn-tools")) return;

      const rect = element.getBoundingClientRect();
      const bigEnough =
        rect.width >= 40 ||
        rect.height >= 40 ||
        element.naturalWidth >= 80 ||
        element.naturalHeight >= 80;

      if (!bigEnough && element.tagName !== "PICTURE") return;

      const label = normalizeAttachmentName(getAttachmentSource(element));
      addAttachment(items, {
        kind: element.tagName === "VIDEO" ? "file" : "image",
        label,
        type: element.tagName === "VIDEO" ? "视频" : inferAttachmentType(label, "图片") || "图片"
      });
    });

    scope
      .querySelectorAll("a, button, [role='button'], [aria-label], [title], [download]")
      .forEach((element) => {
        if (element.closest(".cnlco-turn-tools")) return;

        const source = getAttachmentSource(element);
        const compact = cleanText(source, 220);

        for (const match of compact.matchAll(FILE_NAME_PATTERN)) {
          const label = normalizeAttachmentName(match[0]);
          addAttachment(items, {
            kind: inferAttachmentType(label) === "图片" ? "image" : "file",
            label,
            type: inferAttachmentType(label)
          });
        }

        if (compact.length <= 80) {
          const type = inferAttachmentType("", compact);
          if (type && /^(PDF|Word|PPT|Excel|CSV|文本|Markdown|压缩包|图片|视频|音频)$/.test(type)) {
            addAttachment(items, {
              kind: type === "图片" ? "image" : "file",
              label: "",
              type
            });
          }
        }
      });

    return items.map(({ key, ...item }) => item);
  }

  function formatAttachment(attachment) {
    if (attachment.kind === "image") {
      return attachment.label ? `图片：${attachment.label}` : "图片";
    }

    const type = attachment.type || "文件";
    if (attachment.label) return `${type} 文件：${attachment.label}`;
    return type === "文件" ? "文件" : `${type} 文件`;
  }

  function formatAttachmentsForPlainText(attachments) {
    return attachments.map(formatAttachment).join("；");
  }

  function formatAttachmentsForMarkdown(attachments) {
    if (!attachments.length) return "";
    return `附件：\n${attachments.map((item) => `- ${formatAttachment(item)}`).join("\n")}`;
  }

  function stripLeadingAttachmentText(text, attachments) {
    let value = cleanText(text, 1600);

    for (let i = 0; i < 3; i += 1) {
      const before = value;
      for (const attachment of attachments) {
        if (attachment.label) {
          value = value
            .replace(new RegExp(`^${escapeRegExp(attachment.label)}\\s*`, "i"), "")
            .trim();
        }
        if (attachment.type) {
          value = value
            .replace(new RegExp(`^${escapeRegExp(attachment.type)}\\s*`, "i"), "")
            .trim();
        }
      }
      if (value === before) break;
    }

    return value;
  }

  function stripTitlePrefix(text) {
    return String(text || "")
      .replace(/^(你说|ChatGPT\s*说)\s*[:：]\s*/i, "")
      .replace(
        /^已思考\s*(?:(?:\d+(?:\.\d+)?)\s*(?:分钟|秒|seconds?|secs?|mins?|min|s|m|分)\s*)+/i,
        ""
      )
      .trim();
  }

  function cloneReadableTurn(turn) {
    const clone = turn.cloneNode(true);
    clone
      .querySelectorAll(
        ".cnlco-turn-placeholder, .cnlco-turn-tools, .cnlco-long-control, .cnlco-long-fade"
      )
      .forEach((node) => node.remove());
    return clone;
  }

  function getRawTurnText(turn) {
    if (!turn) return "";

    const clone = cloneReadableTurn(turn);
    return String(clone.textContent || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function getTurnText(turn, attachments = getTurnAttachments(turn)) {
    const text = stripLeadingAttachmentText(getRawTurnText(turn), attachments);
    if (text) return text;
    return formatAttachmentsForPlainText(attachments);
  }

  function getTurnMarkdownContent(turn, attachments = getTurnAttachments(turn)) {
    const text = stripLeadingAttachmentText(getRawTurnText(turn), attachments);
    const attachmentBlock = formatAttachmentsForMarkdown(attachments);
    return [attachmentBlock, text].filter(Boolean).join("\n\n");
  }

  function getTitleFromText(role, text, index) {
    const value = stripTitlePrefix(cleanText(text, 76));

    if (value) return value;
    if (role === "assistant") return `ChatGPT 回复 ${index + 1}`;
    if (role === "user") return `用户消息 ${index + 1}`;
    return `消息 ${index + 1}`;
  }

  function getTitle(turn, index) {
    const role = app.scanner.detectTurnRole(turn);
    const text = getTurnText(turn);
    return getTitleFromText(role, text, index);
  }

  function buildModel(turns, settings, key = getConversationKey()) {
    const resolved = resolveSettings(settings, key);
    const { record } = resolved;
    const total = turns.length;

    const items = turns.map((turn, index) => {
      const turnKey = getTurnKey(turn, index);
      const role = app.scanner.detectTurnRole(turn);
      const attachments = getTurnAttachments(turn);
      const readableText = getTurnText(turn, attachments);
      const title = getTitleFromText(role, readableText, index);
      const bookmarked = Boolean(record.bookmarks[turnKey]);
      const note = record.notes[turnKey]?.text || "";
      const attachmentText = formatAttachmentsForPlainText(attachments);
      const searchText = cleanText(`${readableText} ${attachmentText} ${note}`, 1600).toLowerCase();

      turn.dataset.cnLcoTurnKey = turnKey;
      turn.dataset.cnLcoBookmarked = String(bookmarked);
      turn.dataset.cnLcoRole = role;

      return {
        key: turnKey,
        index,
        number: index + 1,
        total,
        role,
        title,
        searchText,
        bookmarked,
        note
      };
    });

    return {
      conversationKey: key,
      hasOverride: resolved.hasOverride,
      items,
      outline: items,
      bookmarks: items.filter((item) => item.bookmarked),
      notes: items.filter((item) => item.note)
    };
  }

  function createToolButton(action, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cnlco-turn-tool";
    button.dataset.cnlcoAction = action;
    button.textContent = label;
    button.setAttribute("aria-label", label);
    return button;
  }

  function syncToolButtons(tools, role) {
    const config = getToolConfigForRole(role);
    const signature = config.map(([action]) => action).join(",");

    if (tools.dataset.cnlcoSignature === signature) return;

    tools.replaceChildren();

    for (const [action, label] of config) {
      tools.appendChild(createToolButton(action, label));
    }

    tools.dataset.cnlcoSignature = signature;
  }

  function isVisibleElement(element) {
    if (!element || !(element instanceof Element)) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getRoleRoot(turn, role) {
    const selector =
      role === "assistant"
        ? '[data-message-author-role="assistant"]'
        : '[data-message-author-role="user"]';

    if (turn.matches?.(selector)) return turn;
    return turn.querySelector(selector);
  }

  function getCandidateActionRow(button, turn) {
    let node = button.parentElement;

    while (node && node !== turn) {
      const buttons = Array.from(node.querySelectorAll("button")).filter(
        (item) => !item.closest(".cnlco-turn-tools") && isVisibleElement(item)
      );

      const rect = node.getBoundingClientRect();
      const looksLikeActionRow =
        buttons.length >= 2 &&
        buttons.length <= 10 &&
        rect.height > 0 &&
        rect.height <= 64 &&
        rect.width <= Math.max(900, turn.getBoundingClientRect().width);

      if (looksLikeActionRow) return node;
      node = node.parentElement;
    }

    return null;
  }

  function getButtonAccessibleText(button) {
    return [
      button.getAttribute("aria-label"),
      button.getAttribute("title"),
      button.textContent
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function isOfficialMessageActionButton(button) {
    const text = getButtonAccessibleText(button);
    if (!text) return false;

    return [
      "复制",
      "copy",
      "分享",
      "share",
      "重新生成",
      "regenerate",
      "重试",
      "retry",
      "更多",
      "more",
      "朗读",
      "read aloud",
      "编辑",
      "edit",
      "来源",
      "source"
    ].some((keyword) => text.includes(keyword));
  }

  function findOfficialActionRow(turn) {
    const buttons = Array.from(turn.querySelectorAll("button")).filter(
      (button) =>
        !button.closest(".cnlco-turn-tools") &&
        isVisibleElement(button) &&
        isOfficialMessageActionButton(button)
    );
    const rows = [];
    const seen = new Set();

    for (const button of buttons) {
      const row = getCandidateActionRow(button, turn);
      if (!row || seen.has(row)) continue;
      seen.add(row);
      rows.push(row);
    }

    rows.sort(
      (a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top
    );

    return rows[0] || null;
  }

  function findToolPlacement(turn, role, officialRow = findOfficialActionRow(turn)) {
    if (officialRow) {
      return {
        parent: officialRow,
        reference: null,
        placement: "inline"
      };
    }

    const roleRoot = getRoleRoot(turn, role);
    if (roleRoot) {
      return {
        parent: roleRoot.parentElement || turn,
        reference: roleRoot.nextSibling,
        placement: "message"
      };
    }

    return {
      parent: turn,
      reference: null,
      placement: "fallback"
    };
  }

  function placeTurnTools(turn, tools, role, officialRow) {
    const target = findToolPlacement(turn, role, officialRow);
    const shouldLeadOfficialButtons =
      target.placement === "inline" && role === "user";
    const reference = shouldLeadOfficialButtons
      ? target.parent.firstChild
      : target.reference;

    if (tools.parentElement !== target.parent) {
      if (reference) {
        target.parent.insertBefore(tools, reference);
      } else {
        target.parent.appendChild(tools);
      }
    } else if (reference && reference !== tools) {
      target.parent.insertBefore(tools, reference);
    }

    tools.dataset.cnlcoPlacement = target.placement;
    tools.dataset.cnlcoRole = role;
  }

  function holdAssistantToolsUntilComplete(turn, tools, officialRow) {
    if (officialRow) {
      delete turn.dataset.cnLcoToolsPending;
      return false;
    }

    turn.dataset.cnLcoToolsPending = "true";
    tools.remove();
    return true;
  }

  function ensureTurnTools(turns, model) {
    const itemByKey = new Map(model.items.map((item) => [item.key, item]));

    turns.forEach((turn, index) => {
      const key = getTurnKey(turn, index);
      const item = itemByKey.get(key);
      if (!item) return;

      let tools = turn.querySelector(".cnlco-turn-tools");
      if (!tools) {
        tools = document.createElement("div");
        tools.className = "cnlco-turn-tools";
      }

      const officialRow = findOfficialActionRow(turn);
      if (
        item.role === "assistant" &&
        holdAssistantToolsUntilComplete(turn, tools, officialRow)
      ) {
        return;
      }

      if (item.role !== "assistant") {
        delete turn.dataset.cnLcoToolsPending;
      }

      syncToolButtons(tools, item.role);
      placeTurnTools(turn, tools, item.role, officialRow);

      tools.dataset.cnlcoTurnKey = key;
      tools.setAttribute("aria-label", `第 ${item.number} 轮操作`);

      const bookmarkButton = tools.querySelector('[data-cnlco-action="bookmark"]');
      if (bookmarkButton) {
        bookmarkButton.textContent = item.bookmarked ? "已标记" : "标记";
        bookmarkButton.setAttribute(
          "aria-pressed",
          String(Boolean(item.bookmarked))
        );
      }

      const noteButton = tools.querySelector('[data-cnlco-action="note"]');
      if (noteButton) {
        noteButton.textContent = "备注";
        noteButton.setAttribute("aria-pressed", String(Boolean(item.note)));
      }

      if (!tools.dataset.cnlcoBound) {
        tools.dataset.cnlcoBound = "true";
        tools.addEventListener("click", (event) => {
          const button = event.target.closest("button[data-cnlco-action]");
          if (!button) return;
          event.preventDefault();
          event.stopPropagation();

          const action = button.dataset.cnlcoAction;
          app.controller?.handleTurnAction(action, turn);
        });
      }
    });
  }

  function hasReadyPendingAssistantTools() {
    return Array.from(
      document.querySelectorAll('[data-cn-lco-tools-pending="true"]')
    ).some((turn) => findOfficialActionRow(turn));
  }

  function applyFilter(turns, settings, model) {
    const mode = settings.enabled ? settings.viewMode : "all";
    const bookmarked = new Set(model.bookmarks.map((item) => item.key));

    for (const turn of turns) {
      const role = app.scanner.detectTurnRole(turn);
      const key = turn.dataset.cnLcoTurnKey;
      let hidden = false;

      if (mode === "user") hidden = role !== "user";
      if (mode === "assistant") hidden = role !== "assistant";
      if (mode === "bookmarked") hidden = !bookmarked.has(key);

      if (hidden) {
        turn.dataset.cnLcoFiltered = "true";
      } else {
        delete turn.dataset.cnLcoFiltered;
      }
    }
  }

  function findTurnByKey(turns, key) {
    return turns.find((turn, index) => getTurnKey(turn, index) === key) || null;
  }

  function formatRole(role) {
    if (role === "user") return "用户";
    if (role === "assistant") return "ChatGPT";
    return "消息";
  }

  function getPairForTurn(turns, turn) {
    const index = turns.indexOf(turn);
    if (index < 0) return { userTurn: null, assistantTurn: null, pairIndex: 0 };

    const role = app.scanner.detectTurnRole(turn);
    let userTurn = null;
    let assistantTurn = null;

    if (role === "user") {
      userTurn = turn;
      assistantTurn =
        turns.slice(index + 1).find((item) => app.scanner.detectTurnRole(item) === "assistant") ||
        null;
    } else if (role === "assistant") {
      assistantTurn = turn;
      userTurn =
        turns
          .slice(0, index)
          .reverse()
          .find((item) => app.scanner.detectTurnRole(item) === "user") || null;
    }

    return {
      userTurn,
      assistantTurn,
      pairIndex: index + 1
    };
  }

  function turnToMarkdown(turn, index, note = "") {
    const role = formatRole(app.scanner.detectTurnRole(turn));
    const text = getTurnMarkdownContent(turn);
    const noteBlock = note ? `\n\n> 备注：${note}\n` : "";
    return `## 第 ${index + 1} 轮 · ${role}${noteBlock}\n\n${text || "_无文本内容_"}`;
  }

  function pairToMarkdown(turns, turn) {
    const pair = getPairForTurn(turns, turn);
    const parts = [`## 第 ${pair.pairIndex} 轮问答`];

    if (pair.userTurn) {
      parts.push(`### 用户\n\n${getTurnMarkdownContent(pair.userTurn) || "_无文本内容_"}`);
    }

    if (pair.assistantTurn) {
      parts.push(`### ChatGPT\n\n${getTurnMarkdownContent(pair.assistantTurn) || "_无文本内容_"}`);
    }

    return parts.join("\n\n");
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.documentElement.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function buildMarkedMarkdown(turns, settings, model) {
    const record = resolveSettings(settings, getConversationKey()).record;
    const parts = ["# 已标记内容"];

    for (const item of model.bookmarks) {
      const turn = findTurnByKey(turns, item.key);
      if (!turn) continue;
      parts.push(turnToMarkdown(turn, item.index, record.notes[item.key]?.text || ""));
    }

    if (parts.length === 1) parts.push("_暂无已标记内容。_");
    return parts.join("\n\n");
  }

  function buildVisibleMarkdown(turns, settings, model) {
    const record = resolveSettings(settings, getConversationKey()).record;
    const parts = ["# 当前可见内容"];

    turns.forEach((turn, index) => {
      if (turn.dataset.cnLcoFiltered === "true") return;
      if (turn.dataset.cnLcoCollapsed === "age") return;
      const key = getTurnKey(turn, index);
      parts.push(turnToMarkdown(turn, index, record.notes[key]?.text || ""));
    });

    if (parts.length === 1) parts.push("_当前没有可导出的可见内容。_");
    return parts.join("\n\n");
  }

  app.conversation = {
    getConversationKey,
    resolveSettings,
    withConversationData,
    saveCurrentAsOverride,
    clearConversationOverride,
    updateConversationOverride,
    getTurnKey,
    getTurnText,
    getTitle,
    buildModel,
    ensureTurnTools,
    hasReadyPendingAssistantTools,
    applyFilter,
    findTurnByKey,
    pairToMarkdown,
    turnToMarkdown,
    copyText,
    buildMarkedMarkdown,
    buildVisibleMarkdown
  };
})();
