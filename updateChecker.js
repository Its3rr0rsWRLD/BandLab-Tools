var CURRENT_VERSION = "0.0.0";

async function loadVersionFromManifest() {
  try {
    var response = await fetch("manifest.json");
    var manifest = await response.json();
    CURRENT_VERSION = manifest.version;
  } catch (e) {}
}

loadVersionFromManifest();

var VERSION_URL = "https://raw.githubusercontent.com/Its3rr0rsWRLD/BandLab-Tools/refs/heads/main/manifest.json";

async function checkForUpdates() {
  try {
    var response = await fetch(VERSION_URL);
    if (!response.ok) return null;

    var manifestData = await response.json();
    var latestVersion = manifestData.version;

    if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
      return {
        hasUpdate: true,
        latestVersion: latestVersion,
        currentVersion: CURRENT_VERSION,
        releaseNotes: manifestData.release_notes || "No release notes available."
      };
    }

    return { hasUpdate: false, currentVersion: CURRENT_VERSION };
  } catch (e) {
    return null;
  }
}

function compareVersions(v1, v2) {
  var parts1 = v1.split(".").map(Number);
  var parts2 = v2.split(".").map(Number);
  for (var i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    var part1 = parts1[i] || 0;
    var part2 = parts2[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

function showUpdateNotification(updateInfo) {
  var overlay = document.getElementById("updateNotificationOverlay");
  var versionSpan = document.getElementById("updateVersion");
  var releaseNotes = document.getElementById("releaseNotes");

  versionSpan.textContent = updateInfo.latestVersion;
  releaseNotes.textContent = updateInfo.releaseNotes;
  overlay.style.display = "flex";

  var dismissBtn = document.getElementById("dismissUpdate");
  var detailsToggle = document.getElementById("detailsToggle");
  var releaseNotesDetails = document.getElementById("releaseNotesDetails");

  dismissBtn.addEventListener("click", hideUpdateNotification);

  detailsToggle.addEventListener("click", () => {
    releaseNotesDetails.classList.toggle("expanded");
    detailsToggle.classList.toggle("expanded");
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideUpdateNotification();
  });
}

function hideUpdateNotification() {
  document.getElementById("updateNotificationOverlay").style.display = "none";
  chrome.storage.sync.set({ updateDismissed: true });
  showUpdateAlert();
}

function showUpdateAlert() {
  var creditsSection = document.getElementById("creditsSection");
  var updateAlert = document.getElementById("updateAlert");
  var updateAlertLink = document.getElementById("updateAlertLink");

  if (creditsSection && updateAlert) {
    creditsSection.style.display = "none";
    updateAlert.style.display = "flex";

    updateAlertLink.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.storage.sync.set({ updateDismissed: false });
      document.getElementById("updateNotificationOverlay").style.display = "flex";
    });
  }
}