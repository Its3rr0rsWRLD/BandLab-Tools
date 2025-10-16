let harmonyEditorEnabled = true;

chrome.storage.sync.get(["harmonyEditor"], (data) => {
  harmonyEditorEnabled = data.harmonyEditor !== false;
  if (harmonyEditorEnabled) {
    initHarmonyEditor();
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.harmonyEditor) {
    harmonyEditorEnabled = changes.harmonyEditor.newValue !== false;
    if (harmonyEditorEnabled) {
      initHarmonyEditor();
    }
  }
});

function initHarmonyEditor() {
  function unlockEditor() {
    const editableElement = document.evaluate(
      "/html/body/main/div/div/section[2]/div[2]/div[3]/div/div/section[2]/div/div[2]/div/span[3]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (
      editableElement &&
      editableElement.getAttribute("contenteditable") !== "true"
    ) {
      editableElement.setAttribute("contenteditable", "true");
      console.log(
        "%c[BandLab-Tools] ✓ Harmony Editor: Made contenteditable",
        "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
      );
    }

    const disabledElement = document.evaluate(
      "/html/body/main/div/div/section[2]/div[2]/div[3]/div/div/section[2]/div/div[2]/div/span[2]/div",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;

    if (disabledElement && disabledElement.hasAttribute("disabled")) {
      disabledElement.removeAttribute("disabled");
      console.log(
        "%c[BandLab-Tools] ✓ Harmony Editor: Removed disabled attribute",
        "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
      );
    }
  }

  unlockEditor();

  const observer = new MutationObserver(() => {
    unlockEditor();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["contenteditable", "disabled"],
  });

  console.log(
    "%c[BandLab-Tools] Harmony Editor watcher active",
    "background: #667eea; color: #fff; padding: 2px 5px;"
  );
}
