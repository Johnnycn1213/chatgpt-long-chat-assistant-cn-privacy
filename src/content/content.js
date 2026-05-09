(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});
  const shared = window.CNLCOShared;

  if (app.started) return;
  app.started = true;

  const state = (app.state = {
    rawSettings: shared.normalizeSettings(),
    settings: shared.normalizeSettings(),
    conversationKey: "",
    hasConversationOverride: false,
    viewModel: {
      conversationKey: "",
      hasOverride: false,
      items: [],
      outline: [],
      bookmarks: [],
      notes: []
    },
    lastUrl: location.href,
    lastTurnCount: -1,
    observer: null,
    scanQueued: false,
    applying: false,
    latestStats: {
      total: 0,
      keepCount: 8,
      visible: 0,
      collapsed: 0
    }
  });

  const UI_ONLY_SETTING_KEYS = new Set(["panelOpen", "minimized"]);
  const FORCE_APPLY_SETTING_KEY = "__forceApply";
  const VISIBILITY_SHAPE_KEYS = new Set([
    "enabled",
    "keepCount",
    "revealStep",
    "viewMode",
    "placeholderDensity"
  ]);

  function getChangedSettingKeys(previous, current) {
    const keys = new Set([
      ...Object.keys(previous || {}),
      ...Object.keys(current || {})
    ]);
    const changed = [];

    for (const key of keys) {
      if (key === "conversationData") {
        const previousData = JSON.stringify(previous?.conversationData || {});
        const currentData = JSON.stringify(current?.conversationData || {});
        if (previousData !== currentData) changed.push(key);
        continue;
      }

      if (previous?.[key] !== current?.[key]) changed.push(key);
    }

    return changed;
  }

  function resetConversationSession() {
    state.lastTurnCount = -1;
    state.conversationKey = app.conversation.getConversationKey();
    app.visibility.resetRevealState();
    app.scrollReveal.reset();
  }

  function syncEffectiveSettings() {
    state.conversationKey = app.conversation.getConversationKey();
    const resolved = app.conversation.resolveSettings(
      state.rawSettings,
      state.conversationKey
    );

    state.settings = resolved.settings;
    state.hasConversationOverride = resolved.hasOverride;
  }

  function applyNow() {
    if (!document.body || state.applying) return;

    state.applying = true;

    try {
      syncEffectiveSettings();

      const turns = app.scanner.getTurnElements();
      state.lastTurnCount = turns.length;

      const model = app.conversation.buildModel(
        turns,
        state.rawSettings,
        state.conversationKey
      );
      state.viewModel = model;

      app.conversation.ensureTurnTools(turns, model);
      app.conversation.applyFilter(turns, state.settings, model);

      const stats = app.visibility.apply(turns, state.settings);
      stats.visible = turns.filter(
        (turn) =>
          turn.dataset.cnLcoFiltered !== "true" &&
          turn.dataset.cnLcoCollapsed !== "age"
      ).length;
      stats.filtered = turns.filter(
        (turn) => turn.dataset.cnLcoFiltered === "true"
      ).length;

      if (state.settings.enabled && state.settings.collapseLongUserMessage) {
        app.longMessage.apply(turns, state.settings);
      } else {
        app.longMessage.clearAll();
      }

      state.latestStats = stats;
      app.ui.refresh(state.settings, stats, model);
    } finally {
      state.applying = false;
    }
  }

  function requestApply() {
    if (state.scanQueued) return;
    state.scanQueued = true;

    requestAnimationFrame(() => {
      state.scanQueued = false;
      applyNow();
    });
  }

  function checkForPageChanges() {
    if (state.scanQueued) return;
    state.scanQueued = true;

    requestAnimationFrame(() => {
      state.scanQueued = false;

      if (location.href !== state.lastUrl) {
        state.lastUrl = location.href;
        resetConversationSession();
        applyNow();
        return;
      }

      const turnCount = app.scanner.getTurnElements().length;
      if (turnCount !== state.lastTurnCount) {
        applyNow();
        return;
      }

      if (app.conversation.hasReadyPendingAssistantTools?.()) {
        applyNow();
      }
    });
  }

  function setupObserver() {
    if (!document.body) return;
    if (state.observer) state.observer.disconnect();

    state.observer = new MutationObserver(() => {
      checkForPageChanges();
    });

    state.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function shouldUpdateConversationOverride(partial) {
    if (!state.hasConversationOverride) return false;

    const globalOnly = new Set(["panelOpen", "minimized", "conversationData"]);
    return Object.keys(partial).some((key) => !globalOnly.has(key));
  }

  async function updateSettings(partial, options = {}) {
    let next;

    if (
      options.scope === "conversation" ||
      shouldUpdateConversationOverride(partial)
    ) {
      next = app.conversation.updateConversationOverride(
        state.rawSettings,
        state.conversationKey,
        partial
      );
      next = await app.settingsStore.saveSettings({
        conversationData: next.conversationData
      });
    } else {
      next = await app.settingsStore.saveSettings(partial);
    }

    setSettings(next, Object.keys(partial));
  }

  function setSettings(next, changedHint = null) {
    const previous = state.settings;
    state.rawSettings = shared.normalizeSettings(next);
    syncEffectiveSettings();

    const hintedKeys = Array.isArray(changedHint)
      ? changedHint
      : getChangedSettingKeys(previous, state.settings);
    const forceApply = hintedKeys.includes(FORCE_APPLY_SETTING_KEY);
    const changedKeys = hintedKeys.filter(
      (key) => key !== FORCE_APPLY_SETTING_KEY
    );

    if (!changedKeys.length && !forceApply) return;

    const onlyUiStateChanged =
      changedKeys.length > 0 &&
      changedKeys.every((key) => UI_ONLY_SETTING_KEYS.has(key));
    const onlyConversationDataChanged =
      changedKeys.length === 1 && changedKeys[0] === "conversationData";
    const visibilityShapeChanged = changedKeys.some((key) =>
      VISIBILITY_SHAPE_KEYS.has(key)
    );

    if (visibilityShapeChanged) {
      app.visibility.resetRevealState();
    }

    if (onlyUiStateChanged) {
      app.ui.refresh(state.settings, state.latestStats, state.viewModel);
      return;
    }

    if (onlyConversationDataChanged && !forceApply) {
      app.ui.refresh(state.settings, state.latestStats, state.viewModel);
      return;
    }

    requestApply();
  }

  function revealOlder(revealMultiplier = 1) {
    if (!state.settings.enabled) return;

    const turns = app.scanner.getTurnElements();
    const stats = app.visibility.revealOlder(
      turns,
      state.settings,
      revealMultiplier
    );
    stats.visible = turns.filter(
      (turn) =>
        turn.dataset.cnLcoFiltered !== "true" &&
        turn.dataset.cnLcoCollapsed !== "age"
    ).length;
    stats.filtered = turns.filter(
      (turn) => turn.dataset.cnLcoFiltered === "true"
    ).length;
    state.latestStats = stats;

    if (state.settings.collapseLongUserMessage) {
      app.longMessage.apply(turns, state.settings);
    }

    app.ui.refresh(state.settings, stats, state.viewModel);
  }

  function expandTurn(turn) {
    app.visibility.expandTurn(turn);
    requestApply();
  }

  function expandAll() {
    const turns = app.scanner.getTurnElements();
    const stats = app.visibility.expandAll(turns);
    stats.visible = turns.filter(
      (turn) => turn.dataset.cnLcoFiltered !== "true"
    ).length;
    stats.filtered = turns.filter(
      (turn) => turn.dataset.cnLcoFiltered === "true"
    ).length;
    state.latestStats = stats;
    app.ui.refresh(state.settings, stats, state.viewModel);
  }

  async function saveConversationOverride() {
    const next = app.conversation.saveCurrentAsOverride(
      state.rawSettings,
      state.conversationKey
    );
    const saved = await app.settingsStore.saveSettings({
      conversationData: next.conversationData
    });
    setSettings(saved, ["conversationData", FORCE_APPLY_SETTING_KEY]);
  }

  async function clearConversationOverride() {
    const next = app.conversation.clearConversationOverride(
      state.rawSettings,
      state.conversationKey
    );
    const saved = await app.settingsStore.saveSettings({
      conversationData: next.conversationData
    });
    setSettings(saved, ["conversationData", FORCE_APPLY_SETTING_KEY]);
  }

  function getCurrentTurns() {
    return app.scanner.getTurnElements();
  }

  async function saveConversationData(mutator) {
    const next = app.conversation.withConversationData(
      state.rawSettings,
      state.conversationKey,
      mutator
    );
    const saved = await app.settingsStore.saveSettings({
      conversationData: next.conversationData
    });
    state.rawSettings = shared.normalizeSettings(saved);
    syncEffectiveSettings();
  }

  function refreshConversationPanel() {
    state.viewModel.bookmarks = state.viewModel.items.filter(
      (item) => item.bookmarked
    );
    state.viewModel.notes = state.viewModel.items.filter((item) => item.note);
    app.ui.refresh(state.settings, state.latestStats, state.viewModel);
  }

  function syncBookmarkButton(turn, bookmarked) {
    const button = turn.querySelector(
      '.cnlco-turn-tools [data-cnlco-action="bookmark"]'
    );
    if (!button) return;

    button.textContent = bookmarked ? "已标记" : "标记";
    button.setAttribute("aria-pressed", String(Boolean(bookmarked)));
  }

  function syncNoteButton(turn, hasNote) {
    const button = turn.querySelector(
      '.cnlco-turn-tools [data-cnlco-action="note"]'
    );
    if (!button) return;

    button.textContent = "备注";
    button.setAttribute("aria-pressed", String(Boolean(hasNote)));
  }

  function getTurnContext(turn) {
    const key = turn.dataset.cnLcoTurnKey;
    const item = key
      ? state.viewModel.items.find((entry) => entry.key === key)
      : null;

    if (key && item) {
      return { key, item, index: item.index };
    }

    const turns = getCurrentTurns();
    const index = turns.indexOf(turn);
    if (index < 0) return null;

    const fallbackKey = app.conversation.getTurnKey(turn, index);
    return {
      key: fallbackKey,
      item:
        state.viewModel.items.find((entry) => entry.key === fallbackKey) ||
        null,
      index
    };
  }

  async function toggleBookmark(turn) {
    const context = getTurnContext(turn);
    if (!context) return;

    const { key, item } = context;
    const role = item?.role || app.scanner.detectTurnRole(turn);
    const nextBookmarked = !Boolean(item?.bookmarked);

    if (item) item.bookmarked = nextBookmarked;
    turn.dataset.cnLcoBookmarked = String(nextBookmarked);
    if (state.settings.viewMode === "bookmarked") {
      if (nextBookmarked) {
        delete turn.dataset.cnLcoFiltered;
      } else {
        turn.dataset.cnLcoFiltered = "true";
      }
    }
    syncBookmarkButton(turn, nextBookmarked);
    refreshConversationPanel();

    await saveConversationData((record) => {
      if (!nextBookmarked) {
        delete record.bookmarks[key];
      } else {
        record.bookmarks[key] = {
          role,
          createdAt: Date.now()
        };
      }
    });
  }

  async function editNote(turn) {
    const context = getTurnContext(turn);
    if (!context) return;

    const { key, item } = context;
    const currentNote = item?.note || "";
    const nextNote = window.prompt("给这条消息添加本地备注：", currentNote);
    if (nextNote === null) return;

    const trimmed = nextNote.trim().slice(0, 180);
    if (item) {
      item.note = trimmed;
      item.searchText = `${item.searchText || ""} ${trimmed}`.toLowerCase();
    }

    syncNoteButton(turn, Boolean(trimmed));
    refreshConversationPanel();

    await saveConversationData((record) => {
      if (trimmed) {
        record.notes[key] = {
          text: trimmed,
          updatedAt: Date.now()
        };
      } else {
        delete record.notes[key];
      }
    });
  }

  async function copyPair(turn) {
    const turns = getCurrentTurns();
    const markdown = app.conversation.pairToMarkdown(turns, turn);
    await app.conversation.copyText(markdown);
    app.ui.showToast("已复制本轮问答");
  }

  function handleTurnAction(action, turn) {
    if (action === "bookmark") toggleBookmark(turn);
    if (action === "note") editNote(turn);
    if (action === "pair") copyPair(turn);
  }

  function jumpToTurnKey(key) {
    const turns = getCurrentTurns();
    const target = app.conversation.findTurnByKey(turns, key);
    if (!target) return;

    app.scrollReveal.suspend(1600);

    if (state.settings.viewMode !== "all") {
      updateSettings({ viewMode: "all" });
    }

    app.visibility.expandTurn(target);

    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    });
  }

  function exportMarked() {
    const turns = getCurrentTurns();
    const markdown = app.conversation.buildMarkedMarkdown(
      turns,
      state.rawSettings,
      state.viewModel
    );
    app.ui.showExportPreview("已标记内容", markdown);
  }

  function exportVisible() {
    const turns = getCurrentTurns();
    const markdown = app.conversation.buildVisibleMarkdown(
      turns,
      state.rawSettings,
      state.viewModel
    );
    app.ui.showExportPreview("当前可见内容", markdown);
  }

  async function copyExportText(text) {
    await app.conversation.copyText(text);
    app.ui.showToast("已复制导出内容");
  }

  app.controller = {
    updateSettings,
    setSettings,
    requestApply,
    revealOlder,
    expandTurn,
    expandAll,
    saveConversationOverride,
    clearConversationOverride,
    handleTurnAction,
    toggleBookmark,
    editNote,
    copyPair,
    jumpToTurnKey,
    exportMarked,
    exportVisible,
    copyExportText
  };

  async function start() {
    state.rawSettings = await app.settingsStore.loadSettings();
    syncEffectiveSettings();

    app.ui.mount(state.settings);
    app.scrollReveal.attach();
    setupObserver();

    app.settingsStore.onSettingsChanged((next) => {
      setSettings(next);
    });

    [0, 250, 900, 1800, 3200].forEach((delay) => {
      setTimeout(() => {
        requestApply();
      }, delay);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
