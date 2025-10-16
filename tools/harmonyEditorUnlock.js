async function handleHarmonyEditor(tabId, enabled) {
  chrome.storage.sync.get(["autoReload"], (data) => {
    if (data.autoReload !== false) {
      chrome.tabs.query({ url: "*://*.bandlab.com/studio*" }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.reload(tab.id));
      });
    }
  });
}
