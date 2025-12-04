(function () {
  function initTotalProjects() {
    if (
      !window.BANDLAB_TOOLS_SETTINGS ||
      window.BANDLAB_TOOLS_SETTINGS.totalProjects === false
    ) {
      return;
    }

    console.log("[BandLab-Tools] Total Projects tool initialized");

    function displayProjectCount(count, isLoading = true, retryCount = 0) {
      const xpath = "/html/body/main/div/div[2]/div[1]/nav/ul[2]";
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const referenceElement = result.singleNodeValue;

      if (referenceElement && referenceElement.parentNode) {
        let countDisplay = document.getElementById("bandlab-tools-project-count");
        if (!countDisplay) {
          countDisplay = document.createElement("div");
          countDisplay.id = "bandlab-tools-project-count";
          countDisplay.style.padding = "10px 20px";
          countDisplay.style.color = "#999";
          countDisplay.style.fontSize = "14px";
          countDisplay.style.fontWeight = "500";
          countDisplay.style.borderTop = "1px solid #333";
          countDisplay.style.marginTop = "10px";
          countDisplay.style.display = "flex";
          countDisplay.style.alignItems = "center";

          if (!document.getElementById("bandlab-tools-spinner-style")) {
            const style = document.createElement("style");
            style.id = "bandlab-tools-spinner-style";
            style.textContent = `
              @keyframes bandlab-tools-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              .bandlab-tools-spinner {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid #999;
                border-radius: 50%;
                border-top-color: transparent;
                animation: bandlab-tools-spin 1s linear infinite;
                margin-left: 10px;
              }
            `;
            document.head.appendChild(style);
          }

          if (referenceElement.nextSibling) {
            referenceElement.parentNode.insertBefore(countDisplay, referenceElement.nextSibling);
          } else {
            referenceElement.parentNode.appendChild(countDisplay);
          }
        }

        countDisplay.innerHTML = `Total Projects: ${count}`;
        if (isLoading) {
          countDisplay.innerHTML += `<span class="bandlab-tools-spinner"></span>`;
        }
      } else {
        console.log("[BandLab-Tools] Could not find target element to display project count");
        if (retryCount < 5) {
          console.log(`[BandLab-Tools] Retrying display (${retryCount + 1}/5)...`);
          setTimeout(() => displayProjectCount(count, isLoading, retryCount + 1), 300);
        }
      }
    }

    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      this._requestHeaders = {};
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
      if (this._requestHeaders) {
        this._requestHeaders[header] = value;
      }
      return originalSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
        if (
          this._url &&
          this._url.includes("/api/v1.3/users/") &&
          this._url.includes("/songs") &&
          this._url.includes("limit=")
        ) {
          if (this._url.includes("bandlab-tools-request")) {
            return;
          }

          if (this._url.includes("after=")) {
            return;
          }

          console.log("[BandLab-Tools] Detected projects request:", this._url);

          try {
            if (!this.responseText) return;
            const initialData = JSON.parse(this.responseText);

            let totalCount = 0;
            const requestHeaders = this._requestHeaders || {};

            const processData = (data) => {
              let pageCount = 0;
              if (data.data && Array.isArray(data.data)) {
                pageCount = data.data.length;
              } else if (data.paging && typeof data.paging.itemsCount === 'number') {
                pageCount = data.paging.itemsCount;
              }

              if (pageCount > 0) {
                totalCount += pageCount;
                displayProjectCount(totalCount, true);
              }
            };

            processData(initialData);

            if (initialData.paging && initialData.paging.cursors && initialData.paging.cursors.after) {
              const urlObj = new URL(this._url, window.location.origin);
              urlObj.searchParams.set("bandlab-tools-request", "true");
              urlObj.searchParams.set("limit", "100");

              const fetchNextPage = (cursor) => {
                urlObj.searchParams.set("after", cursor);

                fetch(urlObj.toString(), {
                  headers: requestHeaders
                })
                  .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                  })
                  .then(data => {
                    processData(data);

                    if (data.paging && data.paging.cursors && data.paging.cursors.after) {
                      setTimeout(() => fetchNextPage(data.paging.cursors.after), 200);
                    } else {
                      console.log("[BandLab-Tools] Finished counting. Final Total:", totalCount);
                      displayProjectCount(totalCount, false);
                    }
                  })
                  .catch(err => {
                    console.error("[BandLab-Tools] Error fetching page:", err);
                  });
              };

              console.log("[BandLab-Tools] Starting recursive fetch...");
              fetchNextPage(initialData.paging.cursors.after);
            } else {
              console.log("[BandLab-Tools] Finished counting (single page). Total:", totalCount);
              displayProjectCount(totalCount, false);
            }

          } catch (e) {
            console.error("[BandLab-Tools] Error processing projects request:", e);
          }
        }
      });
      return originalSend.apply(this, arguments);
    };
  }

  if (window.BANDLAB_TOOLS_SETTINGS) {
    initTotalProjects();
  } else {
    window.addEventListener("message", (event) => {
      if (event.data.type === "BANDLAB_TOOLS_SETTINGS") {
      }
    });

    setTimeout(initTotalProjects, 300);
  }
})();
