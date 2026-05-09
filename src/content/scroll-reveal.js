(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});

  const TOP_REVEAL_DISTANCE = 140;
  const PLACEHOLDER_PREFETCH_DISTANCE = 520;
  const MAX_REVEALS_PER_FRAME = 4;

  const scrollState = {
    attached: false,
    ticking: false,
    lastScrollTop: 0,
    suspendedUntil: 0
  };

  function readScrollTop(scroller) {
    if (!scroller) return 0;
    return scroller.scrollTop || 0;
  }

  function isSuspended() {
    return Date.now() < scrollState.suspendedUntil;
  }

  function getBoundaryCollapsedTurn() {
    const collapsedTurns = Array.from(
      document.querySelectorAll('[data-cn-lco-collapsed="age"]')
    ).filter((turn) => turn instanceof Element);

    return collapsedTurns[collapsedTurns.length - 1] || null;
  }

  function isBoundaryNearViewport(turn) {
    if (!turn) return false;

    const rect = turn.getBoundingClientRect();
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;

    return (
      rect.bottom > -PLACEHOLDER_PREFETCH_DISTANCE &&
      rect.top < viewportHeight + PLACEHOLDER_PREFETCH_DISTANCE
    );
  }

  function revealNearBoundary() {
    const boundaryTurn = getBoundaryCollapsedTurn();
    if (!isBoundaryNearViewport(boundaryTurn)) return;

    app.controller?.revealOlder(MAX_REVEALS_PER_FRAME);
  }

  function maybeReveal(directionHint) {
    const settings = app.state?.settings;
    if (!settings?.enabled || !settings.autoReveal) return;
    if (isSuspended()) return;

    const scroller = app.visibility.getScrollContainer();
    if (!scroller) return;

    const currentTop = readScrollTop(scroller);
    const direction =
      directionHint || (currentTop < scrollState.lastScrollTop ? "up" : "down");

    scrollState.lastScrollTop = currentTop;

    if (direction !== "up") return;

    revealNearBoundary();

    if (currentTop <= TOP_REVEAL_DISTANCE) {
      app.controller?.revealOlder();
    }
  }

  function scheduleFromEvent(event, directionHint) {
    app.visibility.setScrollContainerFromTarget(event?.target);

    if (scrollState.ticking) return;
    scrollState.ticking = true;

    requestAnimationFrame(() => {
      maybeReveal(directionHint);
      scrollState.ticking = false;
    });
  }

  function onScroll(event) {
    scheduleFromEvent(event, null);
  }

  function onWheel(event) {
    const direction = event.deltaY < 0 ? "up" : "down";
    scheduleFromEvent(event, direction);
  }

  function attach() {
    if (scrollState.attached) return;
    scrollState.attached = true;

    const scroller = app.visibility.getScrollContainer();
    scrollState.lastScrollTop = readScrollTop(scroller);

    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true
    });
    document.addEventListener("wheel", onWheel, {
      capture: true,
      passive: true
    });
    document.addEventListener("touchmove", onScroll, {
      capture: true,
      passive: true
    });
  }

  function reset() {
    scrollState.lastScrollTop = readScrollTop(app.visibility.getScrollContainer());
  }

  function suspend(duration = 1400) {
    scrollState.suspendedUntil = Math.max(
      scrollState.suspendedUntil,
      Date.now() + duration
    );
  }

  app.scrollReveal = {
    attach,
    reset,
    suspend
  };
})();
