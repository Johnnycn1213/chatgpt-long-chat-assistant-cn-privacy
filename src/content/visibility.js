(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});

  const revealState = {
    extraVisible: 0,
    forceAllVisible: false,
    scrollContainer: null
  };

  function clampPlaceholderHeight(rawHeight, density = "normal") {
    const height = Number(rawHeight);
    const bounds = {
      compact: [44, 64],
      normal: [56, 96],
      comfortable: [76, 128]
    };
    const [min, max] = bounds[density] || bounds.normal;

    if (!Number.isFinite(height) || height <= 0) return min;
    return Math.max(min, Math.min(max, Math.round(height * 0.12)));
  }

  function isScrollable(element) {
    if (!element) return false;

    const docScroller =
      element === document.scrollingElement ||
      element === document.documentElement ||
      element === document.body;

    if (docScroller) {
      const scroller = document.scrollingElement || document.documentElement;
      return scroller.scrollHeight - scroller.clientHeight > 160;
    }

    if (!(element instanceof Element)) return false;

    const style = getComputedStyle(element);
    const overflow = style.overflowY;
    if (!["auto", "scroll", "overlay"].includes(overflow)) return false;

    return element.scrollHeight - element.clientHeight > 160;
  }

  function findScrollContainer() {
    const pageScroller = document.scrollingElement || document.documentElement;
    const main = document.querySelector("main");
    if (!main) return pageScroller;

    const candidates = [main, ...main.querySelectorAll("div, section, main")]
      .filter(isScrollable)
      .sort((a, b) => b.clientHeight - a.clientHeight);

    return candidates[0] || pageScroller;
  }

  function getScrollContainer() {
    if (isScrollable(revealState.scrollContainer)) {
      return revealState.scrollContainer;
    }

    revealState.scrollContainer = findScrollContainer();
    return revealState.scrollContainer;
  }

  function setScrollContainerFromTarget(target) {
    let element = target;

    if (element === document) {
      element = document.scrollingElement || document.documentElement;
    }

    if (element instanceof Element && !isScrollable(element)) {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        if (isScrollable(parent)) {
          element = parent;
          break;
        }
        parent = parent.parentElement;
      }
    }

    if (isScrollable(element)) {
      revealState.scrollContainer = element;
    }
  }

  function getFirstVisibleTurn(turns = app.scanner.getTurnElements()) {
    for (const turn of turns) {
      if (turn.dataset.cnLcoCollapsed === "age") continue;

      const rect = turn.getBoundingClientRect();
      if (rect.bottom > 0) return turn;
    }

    return turns.find((turn) => turn.dataset.cnLcoCollapsed !== "age") || null;
  }

  function preserveViewport(callback) {
    const turns = app.scanner.getTurnElements();
    const anchor = getFirstVisibleTurn(turns);
    const scroller = getScrollContainer();

    if (!anchor || !scroller) {
      callback();
      return;
    }

    const before = anchor.getBoundingClientRect().top;
    callback();

    requestAnimationFrame(() => {
      const after = anchor.getBoundingClientRect().top;
      scroller.scrollTop += after - before;
    });
  }

  function getRoleLabel(role) {
    if (role === "user") return "用户消息";
    if (role === "assistant") return "ChatGPT 回复";
    return "消息";
  }

  function normalizePlaceholderStructure(placeholder) {
    let copy = placeholder.querySelector(":scope > .cnlco-placeholder-copy");
    let metaText = placeholder.querySelector(".cnlco-placeholder-meta");
    let mainText = placeholder.querySelector(".cnlco-placeholder-title");
    let actionText = placeholder.querySelector(":scope > .cnlco-placeholder-action");

    if (!copy || !metaText || !mainText || !actionText) {
      placeholder.replaceChildren();

      copy = document.createElement("span");
      copy.className = "cnlco-placeholder-copy";

      metaText = document.createElement("span");
      metaText.className = "cnlco-placeholder-meta";

      mainText = document.createElement("span");
      mainText.className = "cnlco-placeholder-title";

      actionText = document.createElement("span");
      actionText.className = "cnlco-placeholder-action";
      actionText.textContent = "点击展开";

      copy.append(metaText, mainText);
      placeholder.append(copy, actionText);
    }

    return { metaText, mainText, actionText };
  }

  function updatePlaceholderText(placeholder, meta) {
    const { metaText, mainText } = normalizePlaceholderStructure(placeholder);
    const number = Number(meta.index) + 1;
    const total = Number(meta.total) || 0;
    const role = meta.role || "unknown";
    const roleLabel = getRoleLabel(role);
    const turnText =
      Number.isFinite(number) && total > 0
        ? `第 ${number} 轮 / 共 ${total} 轮`
        : "较早消息";

    placeholder.dataset.cnlcoRole = role;
    metaText.textContent = turnText;
    mainText.textContent = `较早${roleLabel}已收起`;
    placeholder.setAttribute("aria-label", `${turnText}，${mainText.textContent}，点击展开`);
  }

  function ensurePlaceholder(turn, meta = {}) {
    let placeholder = turn.querySelector(":scope > .cnlco-turn-placeholder");

    if (!placeholder) {
      placeholder = document.createElement("button");
      placeholder.type = "button";
      placeholder.className = "cnlco-turn-placeholder";
      turn.prepend(placeholder);
    }

    updatePlaceholderText(placeholder, meta);

    if (!placeholder.dataset.cnlcoBound) {
      placeholder.dataset.cnlcoBound = "true";
      placeholder.addEventListener("click", () => {
        app.controller?.expandTurn(turn);
      });
    }

    return placeholder;
  }

  function collapseTurn(turn, settings, meta) {
    if (turn.dataset.cnLcoCollapsed === "age") {
      ensurePlaceholder(turn, meta);
      return;
    }

    const measuredHeight = turn.getBoundingClientRect().height || turn.offsetHeight;
    const placeholder = ensurePlaceholder(turn, meta);
    const placeholderHeight = clampPlaceholderHeight(
      measuredHeight,
      settings.placeholderDensity
    );

    placeholder.style.minHeight = `${placeholderHeight}px`;
    turn.dataset.cnLcoCollapsed = "age";
  }

  function restoreTurn(turn, markManual = false) {
    if (markManual) {
      turn.dataset.cnLcoManualExpanded = "true";
    }

    if (turn.dataset.cnLcoCollapsed === "age") {
      delete turn.dataset.cnLcoCollapsed;
    }

    const placeholder = turn.querySelector(":scope > .cnlco-turn-placeholder");
    if (placeholder) placeholder.remove();
  }

  function clearAgeCollapses(turns = app.scanner.getTurnElements()) {
    for (const turn of turns) {
      restoreTurn(turn, false);
    }
  }

  function apply(turns, settings) {
    const allTurns = turns || app.scanner.getTurnElements();
    const total = allTurns.length;
    const keepCount = Math.max(1, Number(settings.keepCount) || 8);

    if (!settings.enabled || revealState.forceAllVisible || total <= keepCount) {
      clearAgeCollapses(allTurns);
      return {
        total,
        keepCount,
        visible: total,
        collapsed: 0
      };
    }

    const allowedFrom = Math.max(
      0,
      total - keepCount - revealState.extraVisible
    );

    let collapsed = 0;

    for (let index = 0; index < total; index += 1) {
      const turn = allTurns[index];
      const role = app.scanner.detectTurnRole(turn);
      const manualExpanded = turn.dataset.cnLcoManualExpanded === "true";
      const bookmarked = turn.dataset.cnLcoBookmarked === "true";
      const filtered = turn.dataset.cnLcoFiltered === "true";
      const shouldCollapse =
        index < allowedFrom && !manualExpanded && !bookmarked && !filtered;

      if (shouldCollapse) {
        collapseTurn(turn, settings, { index, total, role });
        collapsed += 1;
      } else {
        restoreTurn(turn, false);
      }
    }

    return {
      total,
      keepCount,
      visible: total - collapsed,
      collapsed
    };
  }

  function revealOlder(turns, settings, revealMultiplier = 1) {
    const step = Math.max(1, Number(settings.revealStep) || 2);
    const multiplier = Math.max(1, Number(revealMultiplier) || 1);
    revealState.extraVisible += step * multiplier;

    let stats = null;
    preserveViewport(() => {
      stats = apply(turns, settings);
    });

    return stats || {
      total: turns.length,
      keepCount: settings.keepCount,
      visible: turns.length,
      collapsed: 0
    };
  }

  function expandTurn(turn) {
    preserveViewport(() => {
      restoreTurn(turn, true);
    });
  }

  function expandAll(turns = app.scanner.getTurnElements()) {
    revealState.forceAllVisible = true;

    preserveViewport(() => {
      clearAgeCollapses(turns);
    });

    return {
      total: turns.length,
      keepCount: app.state?.settings?.keepCount || 8,
      visible: turns.length,
      collapsed: 0
    };
  }

  function resetRevealState() {
    revealState.extraVisible = 0;
    revealState.forceAllVisible = false;
    revealState.scrollContainer = null;
  }

  app.visibility = {
    apply,
    revealOlder,
    expandTurn,
    expandAll,
    clearAgeCollapses,
    preserveViewport,
    getScrollContainer,
    setScrollContainerFromTarget,
    isScrollable,
    resetRevealState
  };
})();
