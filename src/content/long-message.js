(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});

  function getCandidate(turn) {
    const roleRoot = app.scanner.getUserMessageRoot(turn);
    if (!roleRoot) return null;

    return roleRoot instanceof Element ? roleRoot : null;
  }

  function ensureFade(target) {
    let fade = target.querySelector(":scope > .cnlco-long-fade");
    if (!fade) {
      fade = document.createElement("div");
      fade.className = "cnlco-long-fade";
      target.appendChild(fade);
    }
    return fade;
  }

  function ensureControl(turn, target, settings) {
    let control = turn.querySelector(":scope > .cnlco-long-control");

    if (!control) {
      control = document.createElement("button");
      control.type = "button";
      control.className = "cnlco-long-control";
      turn.appendChild(control);
    }

    if (!control.dataset.cnlcoBound) {
      control.dataset.cnlcoBound = "true";
      control.addEventListener("click", () => {
        const collapsed = turn.dataset.cnLcoLongState === "collapsed";
        setState(turn, target, !collapsed, settings, true);
      });
    }

    return control;
  }

  function setState(turn, target, collapsed, settings, userAction = false) {
    target.dataset.cnLcoLongTarget = "true";
    target.classList.add("cnlco-long-message-box");
    target.style.setProperty(
      "--cnlco-long-max",
      `${settings.longMessageCollapsedHeight}px`
    );

    const fade = ensureFade(target);
    const control = ensureControl(turn, target, settings);

    if (collapsed) {
      delete turn.dataset.cnLcoLongManualExpanded;
      turn.dataset.cnLcoLongState = "collapsed";
      target.classList.add("cnlco-long-message-collapsed");
      fade.hidden = false;
      control.textContent = "展开完整内容";
    } else {
      if (userAction) {
        turn.dataset.cnLcoLongManualExpanded = "true";
      }

      turn.dataset.cnLcoLongState = "expanded";
      target.classList.remove("cnlco-long-message-collapsed");
      fade.hidden = true;
      control.textContent = "收起长消息";
    }
  }

  function cleanupTurn(turn) {
    const target = turn.querySelector('[data-cn-lco-long-target="true"]');
    if (target) {
      target.classList.remove(
        "cnlco-long-message-box",
        "cnlco-long-message-collapsed"
      );
      target.style.removeProperty("--cnlco-long-max");
      delete target.dataset.cnLcoLongTarget;

      const fade = target.querySelector(":scope > .cnlco-long-fade");
      if (fade) fade.remove();
    }

    const control = turn.querySelector(":scope > .cnlco-long-control");
    if (control) control.remove();

    delete turn.dataset.cnLcoLongState;
    delete turn.dataset.cnLcoLongManualExpanded;
  }

  function clearAll() {
    const managedTargets = document.querySelectorAll(
      '[data-cn-lco-long-target="true"]'
    );

    for (const target of managedTargets) {
      const turn = target.closest(
        'section[data-turn-id], article[data-turn-id], [data-testid^="conversation-turn-"], section, article'
      );
      if (turn) cleanupTurn(turn);
    }
  }

  function apply(turns, settings) {
    if (!settings.enabled || !settings.collapseLongUserMessage) {
      clearAll();
      return;
    }

    const threshold = Number(settings.longMessageHeightThreshold) || 280;

    for (const turn of turns) {
      if (turn.dataset.cnLcoCollapsed === "age") continue;

      const role = app.scanner.detectTurnRole(turn);
      if (role !== "user") {
        cleanupTurn(turn);
        continue;
      }

      const target = getCandidate(turn);
      if (!target) continue;

      const alreadyManaged = target.dataset.cnLcoLongTarget === "true";
      const tallEnough = target.scrollHeight > threshold;

      if (!tallEnough && !alreadyManaged) continue;
      if (!tallEnough && alreadyManaged) {
        cleanupTurn(turn);
        continue;
      }

      if (turn.dataset.cnLcoLongManualExpanded === "true") {
        setState(turn, target, false, settings, false);
        continue;
      }

      if (turn.dataset.cnLcoLongState === "expanded") {
        setState(turn, target, false, settings, false);
        continue;
      }

      setState(turn, target, true, settings, false);
    }
  }

  app.longMessage = {
    apply,
    clearAll
  };
})();
