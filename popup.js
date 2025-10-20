let isOnBandLab = false;
let currentSearchTerm = "";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  const url = currentTab.url || "";
  isOnBandLab = url.includes("bandlab.com");

  const status = document.getElementById("status");
  const statusText = status.querySelector(".status-text");
  const statusIndicator = status.querySelector(".status-indicator");

  if (!isOnBandLab) {
    statusText.textContent = "Not on BandLab";
    statusIndicator.style.background = "#ff6b6b";
    document.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.disabled = true;
    });
    document.querySelectorAll("input[type='text']").forEach((input) => {
      input.disabled = true;
    });
    document.querySelectorAll("input[type='number']").forEach((input) => {
      input.disabled = true;
    });
    document.body.classList.add("not-bandlab");
  }
});

chrome.storage.sync.get(
  [
    "membershipBypass",
    "harmonyEditor",
    "blockAnalytics",
    "sony360Audio",
    "fullExperimentals",
    "autoReload",
    "consoleLogging",
    "theme",
  ],
  (data) => {
    document.getElementById("membershipBypass").checked =
      data.membershipBypass !== false;
    document.getElementById("harmonyEditor").checked =
      data.harmonyEditor !== false;
    document.getElementById("blockAnalytics").checked =
      data.blockAnalytics === true;
    document.getElementById("sony360Audio").checked =
      data.sony360Audio === true;
    document.getElementById("fullExperimentals").checked =
      data.fullExperimentals === true;
    document.getElementById("autoReload").checked = data.autoReload !== false;
    document.getElementById("consoleLogging").checked =
      data.consoleLogging !== false;

    const theme = data.theme || "black-glass";
    document.getElementById("themeSelector").value = theme;
    applyTheme(theme);

    if (data.fullExperimentals === true) {
      document.body.classList.add("expanded");
      document.getElementById("fullExperimentalsSection").style.display =
        "block";
      loadAllExperiments();
    }
  }
);

document.querySelectorAll(".section-header").forEach((header) => {
  header.addEventListener("click", () => {
    const section = header.getAttribute("data-section");
    const content = document.querySelector(`[data-content="${section}"]`);
    const isActive = header.classList.contains("active");

    document
      .querySelectorAll(".section-header")
      .forEach((h) => h.classList.remove("active"));
    document
      .querySelectorAll(".section-content")
      .forEach((c) => c.classList.remove("active"));

    if (!isActive) {
      header.classList.add("active");
      content.classList.add("active");
    }
  });
});

document.querySelector(".section-header").click();

document.getElementById("searchInput").addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  currentSearchTerm = searchTerm;

  document.querySelectorAll(".section").forEach((section) => {
    const sectionText = section.textContent.toLowerCase();

    if (sectionText.includes(searchTerm)) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });

  if (searchTerm) {
    document
      .querySelectorAll(".section:not(.hidden) .section-header")
      .forEach((h) => {
        h.classList.add("active");
        const section = h.getAttribute("data-section");
        document
          .querySelector(`[data-content="${section}"]`)
          .classList.add("active");
      });

    document.querySelectorAll(".experiment-item").forEach((item) => {
      const itemText = item.textContent.toLowerCase();
      if (itemText.includes(searchTerm)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  } else {
    document.querySelectorAll(".experiment-item").forEach((item) => {
      item.style.display = "block";
    });
  }
});

document.getElementById("membershipBypass").addEventListener("change", (e) => {
  if (!isOnBandLab) {
    e.target.checked = !e.target.checked;
    showNotification("Head to BandLab to use this feature");
    return;
  }
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

document.getElementById("blockAnalytics").addEventListener("change", (e) => {
  if (!isOnBandLab) {
    e.target.checked = !e.target.checked;
    showNotification("Head to BandLab to use this feature");
    return;
  }
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

document.getElementById("sony360Audio").addEventListener("change", (e) => {
  if (!isOnBandLab) {
    e.target.checked = !e.target.checked;
    showNotification("Head to BandLab to use this feature");
    return;
  }
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
        e.target.checked ? "Sony 360 Audio enabled" : "Sony 360 Audio disabled"
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

document.getElementById("fullExperimentals").addEventListener("change", (e) => {
  chrome.storage.sync.set({ fullExperimentals: e.target.checked }, () => {
    showNotification(
      e.target.checked
        ? "Full Experimentals enabled"
        : "Full Experimentals disabled"
    );

    if (e.target.checked) {
      document.body.classList.add("expanded");
      document.getElementById("fullExperimentalsSection").style.display =
        "block";
      loadAllExperiments();
    } else {
      document.body.classList.remove("expanded");
      document.getElementById("fullExperimentalsSection").style.display =
        "none";
    }
  });
});

function loadAllExperiments() {
  chrome.tabs.query({ url: "*://*.bandlab.com/*", active: true }, (tabs) => {
    if (tabs.length === 0) {
      document.getElementById("experimentsList").innerHTML =
        '<div class="loading">No active BandLab tab found. Please open BandLab first.</div>';
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          let expKey = null;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (
              key &&
              key.startsWith("amp-exp-") &&
              key.includes("$default_instance-")
            ) {
              expKey = key;
              break;
            }
          }

          if (!expKey) return null;

          try {
            const data = JSON.parse(localStorage.getItem(expKey));
            return { storageKey: expKey, experiments: data };
          } catch (e) {
            console.error("Failed to parse experiments:", e);
            return null;
          }
        },
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          displayExperiments(results[0].result, tabs[0].id);
        } else {
          document.getElementById("experimentsList").innerHTML =
            '<div class="loading">No experiments found in localStorage.</div>';
        }
      }
    );
  });
}

function displayExperiments(data, tabId) {
  const container = document.getElementById("experimentsList");

  if (!data || !data.experiments) {
    container.innerHTML = '<div class="loading">No experiments found.</div>';
    return;
  }

  const experiments = data.experiments;
  const storageKey = data.storageKey;

  if (Object.keys(experiments).length === 0) {
    container.innerHTML = '<div class="loading">No experiments found.</div>';
    return;
  }

  container.innerHTML = "";

  Object.keys(experiments)
    .sort()
    .forEach((expName) => {
      const exp = experiments[expName];
      const currentValue = exp.key;

      const item = document.createElement("div");
      item.className = "experiment-item";

      const name = document.createElement("div");
      name.className = "experiment-name";
      name.textContent = expName
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      const value = document.createElement("div");
      value.className = "experiment-value";
      value.textContent = `Current: ${currentValue}`;

      const controls = document.createElement("div");
      controls.className = "experiment-controls";

      if (currentValue === "on" || currentValue === "off") {
        const label = document.createElement("label");
        label.className = "toggle";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = currentValue === "on";
        input.onchange = () => {
          const newValue = input.checked ? "on" : "off";
          toggleExperiment(tabId, storageKey, expName, newValue);
        };
        const slider = document.createElement("span");
        slider.className = "slider";
        label.appendChild(input);
        label.appendChild(slider);
        controls.appendChild(label);
      } else if (currentValue === "true" || currentValue === "false") {
        const label = document.createElement("label");
        label.className = "toggle";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = currentValue === "true";
        input.onchange = () => {
          const newValue = input.checked ? "true" : "false";
          toggleExperiment(tabId, storageKey, expName, newValue);
        };
        const slider = document.createElement("span");
        slider.className = "slider";
        label.appendChild(input);
        label.appendChild(slider);
        controls.appendChild(label);
      } else if (!isNaN(currentValue) && currentValue !== "") {
        const input = document.createElement("input");
        input.type = "number";
        input.className = "experiment-input";
        input.value = currentValue;
        input.placeholder = "Enter number";
        input.onchange = () => {
          toggleExperiment(tabId, storageKey, expName, input.value);
        };
        controls.appendChild(input);
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "experiment-input";
        input.value = currentValue;
        input.placeholder = "Enter value";
        input.onchange = () => {
          toggleExperiment(tabId, storageKey, expName, input.value);
        };
        controls.appendChild(input);
      }

      item.appendChild(name);
      item.appendChild(value);
      item.appendChild(controls);
      container.appendChild(item);
    });
}

function toggleExperiment(tabId, storageKey, expName, newValue) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      args: [storageKey, expName, newValue],
      func: (key, name, value) => {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data[name]) {
            data[name].key = value;
            if (data[name].value !== undefined) {
              data[name].value = value;
            }
            localStorage.setItem(key, JSON.stringify(data));
            console.log(
              `%c[BandLab-Tools] Experiment "${name}" set to: ${value}`,
              "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
            );
          }
        } catch (e) {
          console.error("Failed to update experiment:", e);
        }
      },
    },
    () => {
      showNotification(`${expName}: ${newValue}`);

      chrome.storage.sync.get(["autoReload"], (data) => {
        if (data.autoReload !== false) {
          setTimeout(() => {
            chrome.tabs.reload(tabId);
          }, 300);
        } else {
          loadAllExperiments();
          reapplySearchFilter();
        }
      });
    }
  );
}

function reapplySearchFilter() {
  if (!currentSearchTerm) return;

  document.querySelectorAll(".experiment-item").forEach((item) => {
    const itemText = item.textContent.toLowerCase();
    if (itemText.includes(currentSearchTerm)) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });
}

document.getElementById("autoReload").addEventListener("change", (e) => {
  chrome.storage.sync.set({ autoReload: e.target.checked }, () => {
    showNotification(
      e.target.checked ? "Auto-reload enabled" : "Auto-reload disabled"
    );
  });
});

document.getElementById("consoleLogging").addEventListener("change", (e) => {
  chrome.storage.sync.set({ consoleLogging: e.target.checked }, () => {
    showNotification(
      e.target.checked ? "Console logging enabled" : "Console logging disabled"
    );
  });
});

document.getElementById("themeSelector").addEventListener("change", (e) => {
  const theme = e.target.value;
  chrome.storage.sync.set({ theme: theme }, () => {
    applyTheme(theme);
    showNotification(
      `Theme changed to ${e.target.options[e.target.selectedIndex].text}`
    );
  });
});

function applyTheme(theme) {
  document.body.classList.remove(
    "black-glass",
    "purple-haze",
    "midnight-blue",
    "neon-pink"
  );

  if (theme !== "black-glass") {
    document.body.classList.add(theme);
  }
}

function showNotification(message) {
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
