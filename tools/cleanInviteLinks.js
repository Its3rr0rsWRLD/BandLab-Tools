(function () {
  if (window.BANDLAB_TOOLS_SETTINGS?.cleanInviteLinks === false) {
    return;
  }

  console.log(
    "%c[BandLab-Tools] cleanInviteLinks.js executing",
    "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
  );

  function initCleanInviteLinks() {
    console.log(
      "%c[BandLab-Tools] cleanInviteLinks initializing",
      "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
    );

    const buttonSelectors = [
      "body > main > div > div > header > div:nth-child(2) > div:nth-child(3) > button",
      "aside > div > div:nth-child(2) > div > div:nth-child(4) > button",
    ];

    function hookCopyButton() {
      for (const selector of buttonSelectors) {
        try {
          const button = document.querySelector(selector);

          if (button) {
            console.log(
              "%c[BandLab-Tools] ✓ Found copy button at:",
              "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;",
              selector
            );

            if (button._bandlabToolsHooked) {
              continue;
            }
            button._bandlabToolsHooked = true;

            button.addEventListener(
              "click",
              async (e) => {
                console.log(
                  "%c[BandLab-Tools] Copy button clicked!",
                  "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
                );
              },
              true
            );

            const copyHandler = async (e) => {
              try {
                setTimeout(async () => {
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    console.log(
                      "[BandLab-Tools] Clipboard text:",
                      clipboardText
                    );

                    if (clipboardText.includes("bandlab.com/join/")) {
                      const match = clipboardText.match(
                        /bandlab\.com\/join\/[a-z0-9]+/
                      );
                      if (match) {
                        const cleanLink = `https://www.${match[0]}`;
                        await navigator.clipboard.writeText(cleanLink);
                        console.log(
                          "%c[BandLab-Tools] ✓ CLEANED & COPIED",
                          "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;",
                          cleanLink
                        );
                      }
                    }
                  } catch (error) {
                    console.error("[BandLab-Tools] Error:", error);
                  }
                }, 100);
              } catch (error) {
                console.error("[BandLab-Tools] Copy event error:", error);
              }
            };

            button._bandlabCopyHandler = copyHandler;
            document.addEventListener("copy", copyHandler);
          }
        } catch (error) {
          console.error(
            "[BandLab-Tools] Error checking selector:",
            selector,
            error
          );
        }
      }
    }

    hookCopyButton();

    const observer = new MutationObserver(() => {
      hookCopyButton();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    console.log(
      "%c[BandLab-Tools] cleanInviteLinks monitoring for buttons",
      "background: #00ff88; color: #000; font-weight: bold; padding: 2px 5px;"
    );
  }

  initCleanInviteLinks();
})();
