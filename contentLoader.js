const TOOLS = {
  cleanInviteLinks: {
    file: "tools/cleanInviteLinks.js",
    defaultEnabled: true,
  },
  blockAnalytics: {
    file: "tools/blockAnalytics.js",
    defaultEnabled: false,
  },
  sony360Audio: {
    file: "tools/sony360Audio.js",
    defaultEnabled: false,
  },
  membershipBypass: {
    file: "tools/membershipBypass.js",
    defaultEnabled: false,
  },
  harmonyEditorUnlock: {
    file: "tools/harmonyEditorUnlock.js",
    defaultEnabled: false,
  },
  fullExperimentals: {
    file: "tools/fullExperimentals.js",
    defaultEnabled: false,
  },
  totalProjects: {
    file: "tools/totalProjects.js",
    defaultEnabled: true,
  },
  playAllSongs: {
    file: "tools/playAllSongs.js",
    defaultEnabled: false,
  },
};

console.log(
  "%c[BandLab-Tools] Content Loader Starting",
  "background: #667eea; color: #fff; padding: 2px 5px;"
);

async function loadEnabledTools() {
  try {
    const storageKeys = Object.keys(TOOLS);
    storageKeys.push("consoleLogging");
    const settings = await chrome.storage.sync.get(storageKeys);
    const consoleLogging = settings.consoleLogging !== false;

    console.log(
      "%c[BandLab-Tools] Loading enabled tools",
      "background: #667eea; color: #fff; padding: 2px 5px;",
      settings
    );

    const loadPromises = [];
    for (const [toolName, toolConfig] of Object.entries(TOOLS)) {
      const isEnabled =
        settings[toolName] !== undefined
          ? settings[toolName]
          : toolConfig.defaultEnabled;

      if (isEnabled) {
        loadPromises.push(loadTool(toolName, consoleLogging));
      }
    }
    await Promise.all(loadPromises);
  } catch (error) {
    console.error("[BandLab-Tools] Error in loadEnabledTools:", error);
  }
}

async function loadTool(toolName, consoleLogging = true) {
  const toolConfig = TOOLS[toolName];
  if (!toolConfig) return;

  try {
    const url = chrome.runtime.getURL(toolConfig.file);
    console.log(
      `%c[BandLab-Tools] Loading ${toolName} from ${url}`,
      "background: #667eea; color: #fff; padding: 2px 5px;"
    );

    return new Promise((resolve) => {
      const scriptElement = document.createElement("script");
      scriptElement.src = url;
      scriptElement.type = "text/javascript";
      scriptElement.dataset.tool = toolName;

      scriptElement.onload = () => {
        if (consoleLogging) {
          console.log(
            `%c[BandLab-Tools] ✓ Loaded: ${toolName}`,
            "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
          );
        }
        resolve();
      };

      scriptElement.onerror = (error) => {
        console.error(`[BandLab-Tools] Failed to load ${toolName}:`, error);
        resolve();
      };

      (document.head || document.documentElement).appendChild(scriptElement);
    });
  } catch (error) {
    console.error(`[BandLab-Tools] Failed to load ${toolName}:`, error);
  }
}

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "sync") {
    console.log(
      "%c[BandLab-Tools] Storage changed",
      "background: #667eea; color: #fff; padding: 2px 5px;",
      changes
    );
    const consoleLogging =
      (await chrome.storage.sync.get("consoleLogging")).consoleLogging !==
      false;
    for (const [toolName, change] of Object.entries(changes)) {
      if (TOOLS[toolName]) {
        if (change.newValue !== false) {
          await loadTool(toolName, consoleLogging);
        }
      }
    }
  }
});

loadEnabledTools();
