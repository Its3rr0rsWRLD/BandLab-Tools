function initBlockAnalytics() {
  document.getElementById("blockAnalytics").addEventListener("change", (e) => {
    chrome.storage.sync.set({ blockAnalytics: e.target.checked }, () => {
      chrome.tabs.query({ url: "*://*.bandlab.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [e.target.checked],
            func: (blocked) => {
              localStorage.setItem(
                "privacyConsent",
                JSON.stringify({
                  essential: blocked ? false : true,
                  functionality: blocked ? false : true,
                  analytics: false,
                  marketing: false,
                })
              );
              console.log(
                `%c[BandLab-Tools] Analytics ${
                  blocked ? "blocked" : "unblocked"
                }`,
                "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
              );
            },
          });
        });

        showNotification(
          e.target.checked ? "Analytics blocked" : "Analytics unblocked"
        );

        chrome.storage.sync.get(["autoReload"], (data) => {
          if (data.autoReload !== false) {
            setTimeout(() => {
              tabs.forEach((tab) => chrome.tabs.reload(tab.id));
            }, 500);
          }
        });
      });
    });
  });
}
