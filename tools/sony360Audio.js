function initSony360Audio() {
  document.getElementById("sony360Audio").addEventListener("change", (e) => {
    chrome.storage.sync.set({ sony360Audio: e.target.checked }, () => {
      chrome.tabs.query({ url: "*://*.bandlab.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [e.target.checked],
            func: (enabled) => {
              let foundKey = null;
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (
                  key &&
                  key.startsWith("amp-exp-") &&
                  key.includes("$default_instance-")
                ) {
                  foundKey = key;
                  break;
                }
              }

              if (foundKey) {
                const currentValue = localStorage.getItem(foundKey);
                try {
                  const data = JSON.parse(currentValue);
                  data.key = enabled ? "on" : "off";
                  localStorage.setItem(foundKey, JSON.stringify(data));
                  console.log(
                    `%c[BandLab-Tools] Sony 360 Audio ${
                      enabled ? "enabled" : "disabled"
                    }`,
                    "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;",
                    foundKey
                  );
                } catch (e) {
                  console.error(
                    "[BandLab-Tools] Failed to parse amplitude data:",
                    e
                  );
                }
              } else {
                console.log(
                  "%c[BandLab-Tools] Sony 360 Audio key not found",
                  "background: #ff9800; color: #000; font-weight: bold; padding: 2px 5px;"
                );
              }
            },
          });
        });

        showNotification(
          e.target.checked
            ? "Sony 360 Audio enabled"
            : "Sony 360 Audio disabled"
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
