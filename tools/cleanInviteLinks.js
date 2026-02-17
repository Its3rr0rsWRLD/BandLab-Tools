(function () {
  if (window.BANDLAB_TOOLS_SETTINGS && window.BANDLAB_TOOLS_SETTINGS.cleanInviteLinks === false) return;

  function initCleanInviteLinks() {
    var buttonSelectors = [
      "body > main > div > div > header > div:nth-child(2) > div:nth-child(3) > button",
      "aside > div > div:nth-child(2) > div > div:nth-child(4) > button"
    ];

    function hookCopyButton() {
      for (var i = 0; i < buttonSelectors.length; i++) {
        try {
          var button = document.querySelector(buttonSelectors[i]);
          if (!button || button._bandlabToolsHooked) continue;
          button._bandlabToolsHooked = true;

          var copyHandler = function () {
            setTimeout(async function () {
              try {
                var clipboardText = await navigator.clipboard.readText();
                if (clipboardText.includes("bandlab.com/join/")) {
                  var match = clipboardText.match(/bandlab\.com\/join\/[a-z0-9]+/);
                  if (match) {
                    var cleanLink = "https://www." + match[0];
                    await navigator.clipboard.writeText(cleanLink);
                  }
                }
              } catch (e) {}
            }, 100);
          };

          button._bandlabCopyHandler = copyHandler;
          document.addEventListener("copy", copyHandler);
        } catch (e) {}
      }
    }

    hookCopyButton();

    var observer = new MutationObserver(function () { hookCopyButton(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  initCleanInviteLinks();
})();