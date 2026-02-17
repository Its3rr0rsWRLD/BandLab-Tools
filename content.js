chrome.storage.sync.get(
  ["membershipBypass", "consoleLogging", "cleanInviteLinks", "blockAnalytics",
   "sony360Audio", "harmonyEditorUnlock", "fullExperimentals", "totalProjects", "playAllSongs"],
  (data) => {
    var settings = {
      membershipBypass: data.membershipBypass === true,
      consoleLogging: data.consoleLogging !== false,
      cleanInviteLinks: data.cleanInviteLinks !== false,
      blockAnalytics: data.blockAnalytics === true,
      sony360Audio: data.sony360Audio === true,
      harmonyEditorUnlock: data.harmonyEditorUnlock !== false,
      fullExperimentals: data.fullExperimentals === true,
      totalProjects: data.totalProjects !== false,
      playAllSongs: data.playAllSongs === true
    };
    window.postMessage({ type: "BANDLAB_TOOLS_SETTINGS", settings: settings }, "*");
  }
);

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync") {
    chrome.storage.sync.get(
      ["membershipBypass", "consoleLogging", "cleanInviteLinks", "blockAnalytics",
       "sony360Audio", "harmonyEditorUnlock", "fullExperimentals", "totalProjects", "playAllSongs"],
      (data) => {
        var settings = {
          membershipBypass: data.membershipBypass !== false,
          consoleLogging: data.consoleLogging !== false,
          cleanInviteLinks: data.cleanInviteLinks !== false,
          blockAnalytics: data.blockAnalytics !== false,
          sony360Audio: data.sony360Audio !== false,
          harmonyEditorUnlock: data.harmonyEditorUnlock !== false,
          fullExperimentals: data.fullExperimentals !== false,
          totalProjects: data.totalProjects !== false,
          playAllSongs: data.playAllSongs !== false
        };
        window.postMessage({ type: "BANDLAB_TOOLS_SETTINGS", settings: settings }, "*");
      }
    );
  }
});