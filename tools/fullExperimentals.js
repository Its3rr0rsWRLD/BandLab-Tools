function initFullExperimentals() {
  document
    .getElementById("fullExperimentals")
    .addEventListener("change", (e) => {
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
}

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
        }
      });
    }
  );
}
