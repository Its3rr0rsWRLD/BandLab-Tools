function initMembershipBypass() {
  document
    .getElementById("membershipBypass")
    .addEventListener("change", (e) => {
      chrome.storage.sync.set({ membershipBypass: e.target.checked }, () => {
        showNotification(
          e.target.checked
            ? "Membership Override enabled"
            : "Membership Override disabled"
        );

        chrome.storage.sync.get(["autoReload"], (data) => {
          if (data.autoReload !== false) {
            chrome.tabs.query({ url: "*://*.bandlab.com/*" }, (tabs) => {
              tabs.forEach((tab) => chrome.tabs.reload(tab.id));
            });
          }
        });
      });
    });
}
