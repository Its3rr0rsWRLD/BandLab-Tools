chrome.storage.sync.get(["membershipBypass", "consoleLogging"], (data) => {
  const settings = {
    membershipBypass: data.membershipBypass !== false,
    consoleLogging: data.consoleLogging !== false,
  };

  window.postMessage(
    {
      type: "BANDLAB_TOOLS_SETTINGS",
      settings: settings,
    },
    "*"
  );
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    chrome.storage.sync.get(["membershipBypass", "consoleLogging"], (data) => {
      const settings = {
        membershipBypass: data.membershipBypass !== false,
        consoleLogging: data.consoleLogging !== false,
      };

      window.postMessage(
        {
          type: "BANDLAB_TOOLS_SETTINGS",
          settings: settings,
        },
        "*"
      );
    });
  }
});
