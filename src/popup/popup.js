(() => {
  const app = window.ChatGPTLongChatOptimizerCN;

  let currentSettings = window.CNLCOShared.normalizeSettings();

  const statusText = document.getElementById("statusText");
  const keepText = document.getElementById("keepText");
  const toggleEnabled = document.getElementById("toggleEnabled");
  const resetDefaults = document.getElementById("resetDefaults");
  const openChat = document.getElementById("openChat");

  function render() {
    statusText.textContent = currentSettings.enabled ? "已启用" : "已暂停";
    keepText.textContent = `最近 ${currentSettings.keepCount} 条`;
    toggleEnabled.textContent = currentSettings.enabled ? "暂停助手" : "恢复助手";
  }

  async function load() {
    currentSettings = await app.settingsStore.loadSettings();
    render();
  }

  openChat.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://chatgpt.com/" });
  });

  toggleEnabled.addEventListener("click", async () => {
    currentSettings = await app.settingsStore.saveSettings({
      enabled: !currentSettings.enabled
    });
    render();
  });

  resetDefaults.addEventListener("click", async () => {
    currentSettings = await app.settingsStore.resetSettings();
    render();
  });

  load();
})();
