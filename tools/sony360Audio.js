function initSony360Audio() {
  document.getElementById("sony360Audio").addEventListener("change", (e) => {
    chrome.storage.sync.set({ sony360Audio: e.target.checked }, () => {
      chrome.tabs.query({ url: "*://*.bandlab.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [e.target.checked],
            func: (enabled) => {
              var foundKey = null;
              for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.startsWith("amp-exp-") && key.includes("$default_instance-")) {
                  foundKey = key;
                  break;
                }
              }
              if (foundKey) {
                try {
                  var data = JSON.parse(localStorage.getItem(foundKey));
                  data.key = enabled ? "on" : "off";
                  localStorage.setItem(foundKey, JSON.stringify(data));
                } catch (e) {}
              }
            }
          });
        });

        showNotification(e.target.checked ? "Sony 360 Audio enabled" : "Sony 360 Audio disabled");

        chrome.storage.sync.get(["autoReload"], (data) => {
          if (data.autoReload !== false) {
            setTimeout(() => { tabs.forEach((tab) => chrome.tabs.reload(tab.id)); }, 500);
          }
        });
      });
    });
  });
}