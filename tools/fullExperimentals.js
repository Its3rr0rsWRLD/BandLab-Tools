function initFullExperimentals() {
  document.getElementById("fullExperimentals").addEventListener("change", (e) => {
    chrome.storage.sync.set({ fullExperimentals: e.target.checked }, () => {
      showNotification(e.target.checked ? "Full Experimentals enabled" : "Full Experimentals disabled");
      if (e.target.checked) {
        document.body.classList.add("expanded");
        document.getElementById("fullExperimentalsSection").style.display = "block";
        loadAllExperiments();
      } else {
        document.body.classList.remove("expanded");
        document.getElementById("fullExperimentalsSection").style.display = "none";
      }
    });
  });
}

function loadAllExperiments() {
  chrome.tabs.query({ url: "*://*.bandlab.com/*", active: true }, (tabs) => {
    if (tabs.length === 0) {
      document.getElementById("experimentsList").innerHTML = '<div class="loading">No active BandLab tab found. Please open BandLab first.</div>';
      return;
    }

    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        var expKey = null;
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && key.startsWith("amp-exp-") && key.includes("$default_instance-")) {
            expKey = key;
            break;
          }
        }
        if (!expKey) return null;
        try {
          return { storageKey: expKey, experiments: JSON.parse(localStorage.getItem(expKey)) };
        } catch (e) {
          return null;
        }
      }
    }, (results) => {
      if (results && results[0] && results[0].result) {
        displayExperiments(results[0].result, tabs[0].id);
      } else {
        document.getElementById("experimentsList").innerHTML = '<div class="loading">No experiments found in localStorage.</div>';
      }
    });
  });
}

function displayExperiments(data, tabId) {
  var container = document.getElementById("experimentsList");
  if (!data || !data.experiments) {
    container.innerHTML = '<div class="loading">No experiments found.</div>';
    return;
  }

  var experiments = data.experiments;
  var storageKey = data.storageKey;
  if (Object.keys(experiments).length === 0) {
    container.innerHTML = '<div class="loading">No experiments found.</div>';
    return;
  }

  container.innerHTML = "";

  Object.keys(experiments).sort().forEach((expName) => {
    var exp = experiments[expName];
    var currentValue = exp.key;

    var item = document.createElement("div");
    item.className = "experiment-item";

    var name = document.createElement("div");
    name.className = "experiment-name";
    name.textContent = expName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    var value = document.createElement("div");
    value.className = "experiment-value";
    value.textContent = "Current: " + currentValue;

    var controls = document.createElement("div");
    controls.className = "experiment-controls";

    if (currentValue === "on" || currentValue === "off") {
      var label = document.createElement("label");
      label.className = "toggle";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = currentValue === "on";
      input.onchange = () => { toggleExperiment(tabId, storageKey, expName, input.checked ? "on" : "off"); };
      var slider = document.createElement("span");
      slider.className = "slider";
      label.appendChild(input);
      label.appendChild(slider);
      controls.appendChild(label);
    } else if (currentValue === "true" || currentValue === "false") {
      var label = document.createElement("label");
      label.className = "toggle";
      var input = document.createElement("input");
      input.type = "checkbox";
      input.checked = currentValue === "true";
      input.onchange = () => { toggleExperiment(tabId, storageKey, expName, input.checked ? "true" : "false"); };
      var slider = document.createElement("span");
      slider.className = "slider";
      label.appendChild(input);
      label.appendChild(slider);
      controls.appendChild(label);
    } else if (!isNaN(currentValue) && currentValue !== "") {
      var input = document.createElement("input");
      input.type = "number";
      input.className = "experiment-input";
      input.value = currentValue;
      input.placeholder = "Enter number";
      input.onchange = () => { toggleExperiment(tabId, storageKey, expName, input.value); };
      controls.appendChild(input);
    } else {
      var input = document.createElement("input");
      input.type = "text";
      input.className = "experiment-input";
      input.value = currentValue;
      input.placeholder = "Enter value";
      input.onchange = () => { toggleExperiment(tabId, storageKey, expName, input.value); };
      controls.appendChild(input);
    }

    item.appendChild(name);
    item.appendChild(value);
    item.appendChild(controls);
    container.appendChild(item);
  });
}

function toggleExperiment(tabId, storageKey, expName, newValue) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    args: [storageKey, expName, newValue],
    func: (key, name, value) => {
      try {
        var data = JSON.parse(localStorage.getItem(key));
        if (data[name]) {
          data[name].key = value;
          if (data[name].value !== undefined) data[name].value = value;
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch (e) {}
    }
  }, () => {
    showNotification(expName + ": " + newValue);
    chrome.storage.sync.get(["autoReload"], (data) => {
      if (data.autoReload !== false) {
        setTimeout(() => { chrome.tabs.reload(tabId); }, 300);
      } else {
        loadAllExperiments();
      }
    });
  });
}