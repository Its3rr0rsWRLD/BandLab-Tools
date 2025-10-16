async function handleMembershipOverride(tabId, enabled) {
  if (!enabled) {
    chrome.tabs.query({ url: "*://*.bandlab.com/*" }, (tabs) => {
      tabs.forEach((tab) => chrome.tabs.reload(tab.id));
    });
    return;
  }

  chrome.storage.sync.get(["autoReload"], (data) => {
    if (data.autoReload !== false) {
      chrome.tabs.query({ url: "*://*.bandlab.com/*" }, (tabs) => {
        tabs.forEach((tab) => chrome.tabs.reload(tab.id));
      });
    }
  });
}

function showMembershipNotification(message) {
  const status = document.getElementById("status");
  const originalHTML = status.innerHTML;

  status.innerHTML = `
    <span class="status-indicator" style="background: #00ff88;"></span>
    <span class="status-text">${message}</span>
  `;

  setTimeout(() => {
    status.innerHTML = originalHTML;
  }, 2000);
}
