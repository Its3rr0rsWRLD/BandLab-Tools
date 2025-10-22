function initHarmonyEditor() {
  document.getElementById("harmonyEditor").addEventListener("change", (e) => {
    if (!isOnBandLab) {
      e.target.checked = !e.target.checked;
      showNotification("Head to BandLab to use this feature");
      return;
    }
    chrome.storage.sync.set({ harmonyEditor: e.target.checked }, () => {
      showNotification(
        e.target.checked
          ? "Harmony Editor unlock enabled"
          : "Harmony Editor unlock disabled"
      );

      chrome.storage.sync.get(["autoReload"], (data) => {
        if (data.autoReload !== false) {
          chrome.tabs.query({ url: "*://*.bandlab.com/studio*" }, (tabs) => {
            tabs.forEach((tab) => chrome.tabs.reload(tab.id));
          });
        }
      });
    });
  });
}
