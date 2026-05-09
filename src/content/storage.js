(() => {
  const app = (window.ChatGPTLongChatOptimizerCN =
    window.ChatGPTLongChatOptimizerCN || {});
  const shared = window.CNLCOShared;

  function getStorageArea() {
    try {
      return chrome?.storage?.sync || chrome?.storage?.local || null;
    } catch {
      return null;
    }
  }

  function storageGet(area, key) {
    return new Promise((resolve) => {
      if (!area) {
        resolve({});
        return;
      }

      try {
        area.get(key, (items) => {
          if (chrome?.runtime?.lastError) {
            resolve({});
            return;
          }

          resolve(items || {});
        });
      } catch {
        resolve({});
      }
    });
  }

  function storageSet(area, value) {
    return new Promise((resolve) => {
      if (!area) {
        resolve();
        return;
      }

      try {
        area.set(value, () => {
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }

  async function loadSettings() {
    const area = getStorageArea();
    const data = await storageGet(area, shared.STORAGE_KEY);
    return shared.normalizeSettings(data[shared.STORAGE_KEY]);
  }

  async function saveSettings(partial) {
    const area = getStorageArea();
    const current = await loadSettings();
    const next = shared.normalizeSettings({ ...current, ...partial });
    await storageSet(area, { [shared.STORAGE_KEY]: next });
    return next;
  }

  async function resetSettings() {
    const area = getStorageArea();
    const next = shared.normalizeSettings(shared.DEFAULT_SETTINGS);
    await storageSet(area, { [shared.STORAGE_KEY]: next });
    return next;
  }

  function onSettingsChanged(callback) {
    if (!chrome?.storage?.onChanged) return () => {};

    const listener = (changes, areaName) => {
      if (areaName !== "sync" && areaName !== "local") return;

      const change = changes[shared.STORAGE_KEY];
      if (!change) return;

      callback(shared.normalizeSettings(change.newValue));
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  app.settingsStore = {
    loadSettings,
    saveSettings,
    resetSettings,
    onSettingsChanged
  };
})();
