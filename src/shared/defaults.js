(() => {
  const STORAGE_KEY = "cn_lco_settings";

  const DEFAULT_SETTINGS = Object.freeze({
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
  });

  const KEEP_COUNT_OPTIONS = Object.freeze([5, 8, 12, 20]);
  const THEME_OPTIONS = Object.freeze(["auto", "light", "dark"]);
  const VIEW_MODE_OPTIONS = Object.freeze(["all", "user", "assistant", "bookmarked"]);
  const PLACEHOLDER_DENSITY_OPTIONS = Object.freeze([
    "compact",
    "normal",
    "comfortable"
  ]);

  function toBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }

  function toInteger(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, Math.round(number)));
  }

  function normalizeSettings(input = {}) {
    const source = input && typeof input === "object" ? input : {};

    const keepCount = KEEP_COUNT_OPTIONS.includes(Number(source.keepCount))
      ? Number(source.keepCount)
      : DEFAULT_SETTINGS.keepCount;

    const theme = THEME_OPTIONS.includes(source.theme)
      ? source.theme
      : DEFAULT_SETTINGS.theme;

    const viewMode = VIEW_MODE_OPTIONS.includes(source.viewMode)
      ? source.viewMode
      : DEFAULT_SETTINGS.viewMode;

    const placeholderDensity = PLACEHOLDER_DENSITY_OPTIONS.includes(
      source.placeholderDensity
    )
      ? source.placeholderDensity
      : DEFAULT_SETTINGS.placeholderDensity;

    const conversationData =
      source.conversationData && typeof source.conversationData === "object"
        ? source.conversationData
        : {};

    return {
      enabled: toBoolean(source.enabled, DEFAULT_SETTINGS.enabled),
      keepCount,
      autoReveal: toBoolean(source.autoReveal, DEFAULT_SETTINGS.autoReveal),
      revealStep: toInteger(
        source.revealStep,
        DEFAULT_SETTINGS.revealStep,
        1,
        8
      ),
      collapseLongUserMessage: toBoolean(
        source.collapseLongUserMessage,
        DEFAULT_SETTINGS.collapseLongUserMessage
      ),
      longMessageHeightThreshold: toInteger(
        source.longMessageHeightThreshold,
        DEFAULT_SETTINGS.longMessageHeightThreshold,
        160,
        1200
      ),
      longMessageCollapsedHeight: toInteger(
        source.longMessageCollapsedHeight,
        DEFAULT_SETTINGS.longMessageCollapsedHeight,
        96,
        600
      ),
      panelOpen: toBoolean(source.panelOpen, DEFAULT_SETTINGS.panelOpen),
      theme,
      viewMode,
      minimized: toBoolean(source.minimized, DEFAULT_SETTINGS.minimized),
      placeholderDensity,
      conversationData
    };
  }

  window.CNLCOShared = {
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    KEEP_COUNT_OPTIONS,
    normalizeSettings
  };
})();
