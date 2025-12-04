let CURRENT_VERSION = "0.0.0";

async function loadVersionFromManifest() {
    try {
        const response = await fetch("manifest.json");
        const manifest = await response.json();
        CURRENT_VERSION = manifest.version;
    } catch (error) {
        console.error("Error loading version from manifest:", error);
    }
}

loadVersionFromManifest();
const VERSION_URL = "https://raw.githubusercontent.com/Its3rr0rsWRLD/BandLab-Tools/refs/heads/main/manifest.json";

async function checkForUpdates() {
  try {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
      console.error("Failed to fetch version info");
      return null;
    }
    
    const manifestData = await response.json();
    const latestVersion = manifestData.version;
    
    if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
      return {
        hasUpdate: true,
        latestVersion: latestVersion,
        currentVersion: CURRENT_VERSION,
        releaseNotes: manifestData.description || "No release notes available."
      };
    }
    
    return {
      hasUpdate: false,
      currentVersion: CURRENT_VERSION
    };
  } catch (error) {
    console.error("Error checking for updates:", error);
    return null;
  }
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

function showUpdateNotification(updateInfo) {
  const overlay = document.getElementById('updateNotificationOverlay');
  const versionSpan = document.getElementById('updateVersion');
  const releaseNotes = document.getElementById('releaseNotes');
  
  versionSpan.textContent = updateInfo.latestVersion;
  releaseNotes.textContent = updateInfo.releaseNotes;
  
  overlay.style.display = 'flex';
  
  const dismissBtn = document.getElementById('dismissUpdate');
  const detailsToggle = document.getElementById('detailsToggle');
  const releaseNotesDetails = document.getElementById('releaseNotesDetails');
  
  dismissBtn.addEventListener('click', hideUpdateNotification);
  
  detailsToggle.addEventListener('click', () => {
    releaseNotesDetails.classList.toggle('expanded');
    detailsToggle.classList.toggle('expanded');
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideUpdateNotification();
    }
  });
}

function hideUpdateNotification() {
  const overlay = document.getElementById('updateNotificationOverlay');
  overlay.style.display = 'none';
  
  chrome.storage.sync.set({ updateDismissed: true });
  
  showUpdateAlert();
}

function showUpdateAlert() {
  const creditsSection = document.getElementById('creditsSection');
  const updateAlert = document.getElementById('updateAlert');
  const updateAlertLink = document.getElementById('updateAlertLink');
  
  if (creditsSection && updateAlert) {
    creditsSection.style.display = 'none';
    updateAlert.style.display = 'flex';
    
    updateAlertLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.storage.sync.set({ updateDismissed: false });
      const overlay = document.getElementById('updateNotificationOverlay');
      overlay.style.display = 'flex';
    });
  }
}
