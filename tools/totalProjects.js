(function () {
  var allSongs = [];
  var initialized = false;

  function initTotalProjects() {
    if (initialized) return;
    if (window.BANDLAB_TOOLS_SETTINGS && window.BANDLAB_TOOLS_SETTINGS.totalProjects === false) return;
    initialized = true;

    var isLibraryPage = window.location.pathname.includes("/library/projects/recent");

    function displayProjectCount(count, isLoading, retryCount) {
      isLoading = isLoading !== false;
      retryCount = retryCount || 0;

      var xpath = "/html/body/main/div/div[2]/div[1]/nav/ul[2]";
      var result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      var referenceElement = result.singleNodeValue;

      if (referenceElement && referenceElement.parentNode) {
        var countDisplay = document.getElementById("bandlab-tools-project-count");
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
          countDisplay.style.justifyContent = "center";

          if (!document.getElementById("bandlab-tools-spinner-style")) {
            var style = document.createElement("style");
            style.id = "bandlab-tools-spinner-style";
            style.textContent = [
              "@keyframes bandlab-tools-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }",
              ".bandlab-tools-spinner {",
              "  display: inline-block;",
              "  width: 14px;",
              "  height: 14px;",
              "  border: 2px solid #999;",
              "  border-radius: 50%;",
              "  border-top-color: transparent;",
              "  animation: bandlab-tools-spin 1s linear infinite;",
              "  margin-left: 10px;",
              "}"
            ].join("\n");
            document.head.appendChild(style);
          }

          if (referenceElement.nextSibling) {
            referenceElement.parentNode.insertBefore(countDisplay, referenceElement.nextSibling);
          } else {
            referenceElement.parentNode.appendChild(countDisplay);
          }
        }

        countDisplay.innerHTML = "Total Projects: " + count;
        if (isLoading) {
          countDisplay.innerHTML += '<span class="bandlab-tools-spinner"></span>';
        }
      } else if (retryCount < 5) {
        setTimeout(function () { displayProjectCount(count, isLoading, retryCount + 1); }, 300);
      }
    }

    var originalOpen = XMLHttpRequest.prototype.open;
    var originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    var originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      this._requestHeaders = {};
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
      if (this._requestHeaders) this._requestHeaders[header] = value;
      return originalSetRequestHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
        if (!this._url ||
            !this._url.includes("/api/v1.3/users/") ||
            !this._url.includes("/songs") ||
            !this._url.includes("limit=")) return;

        if (this._url.includes("bandlab-tools-request") || this._url.includes("after=")) return;

        try {
          if (!this.responseText) return;
          var initialData = JSON.parse(this.responseText);
          var totalCount = 0;
          var requestHeaders = this._requestHeaders || {};

          var processData = function (data) {
            var pageCount = 0;
            if (data.data && Array.isArray(data.data)) {
              pageCount = data.data.length;
              if (isLibraryPage) {
                data.data.forEach(function (song) {
                  if (song.id && song.name) {
                    allSongs.push({ id: song.id, name: song.name });
                  }
                });
              }
            } else if (data.paging && typeof data.paging.itemsCount === "number") {
              pageCount = data.paging.itemsCount;
            }
            if (pageCount > 0) {
              totalCount += pageCount;
              displayProjectCount(totalCount, true);
            }
          };

          processData(initialData);

          if (initialData.paging && initialData.paging.cursors && initialData.paging.cursors.after) {
            var urlObj = new URL(this._url, window.location.origin);
            urlObj.searchParams.set("bandlab-tools-request", "true");
            urlObj.searchParams.set("limit", "100");

            var fetchNextPage = function (cursor) {
              urlObj.searchParams.set("after", cursor);
              fetch(urlObj.toString(), { headers: requestHeaders })
                .then(function (response) {
                  if (!response.ok) throw new Error("HTTP " + response.status);
                  return response.json();
                })
                .then(function (data) {
                  processData(data);
                  if (data.paging && data.paging.cursors && data.paging.cursors.after) {
                    setTimeout(function () { fetchNextPage(data.paging.cursors.after); }, 200);
                  } else {
                    displayProjectCount(totalCount, false);
                    if (isLibraryPage) {
                      window.postMessage({ type: "BANDLAB_TOOLS_SONGS_DATA", songs: allSongs, headers: requestHeaders }, "*");
                    }
                  }
                })
                .catch(function () {});
            };

            fetchNextPage(initialData.paging.cursors.after);
          } else {
            displayProjectCount(totalCount, false);
            if (isLibraryPage) {
              window.postMessage({ type: "BANDLAB_TOOLS_SONGS_DATA", songs: allSongs, headers: requestHeaders }, "*");
            }
          }
        } catch (e) {}
      });

      return originalSend.apply(this, arguments);
    };
  }

  if (window.BANDLAB_TOOLS_SETTINGS) initTotalProjects();

  window.addEventListener("message", function (event) {
    if (event.data.type === "BANDLAB_TOOLS_SETTINGS") {
      window.BANDLAB_TOOLS_SETTINGS = event.data.settings;
      if (event.data.settings.totalProjects !== false) initTotalProjects();
    }
  });

  var proactiveDone = false;

  function proactiveFetch() {
    if (proactiveDone) return;
    if (document.getElementById("bandlab-tools-project-count")) { proactiveDone = true; return; }
    if (!window.location.pathname.includes("/library/projects/recent")) return;

    var userId = null;
    var metaEl = document.querySelector('meta[property="bandlab:userId"]') ||
                 document.querySelector('meta[name="bandlab:userId"]');
    if (metaEl) userId = metaEl.content;

    if (!userId) {
      try {
        var m = document.cookie.match(/userId=([a-f0-9-]{36})/i);
        if (m) userId = m[1];
      } catch (e) {}
    }

    if (!userId && window.__BANDLAB_USER__) userId = window.__BANDLAB_USER__.id;

    if (!userId) {
      var scripts = document.querySelectorAll('script[type="application/json"]');
      for (var i = 0; i < scripts.length; i++) {
        try {
          var d = JSON.parse(scripts[i].textContent);
          if (d && d.userId) { userId = d.userId; break; }
          if (d && d.user && d.user.id) { userId = d.user.id; break; }
        } catch (e) {}
      }
    }

    if (!userId) {
      var match = document.documentElement.innerHTML.match(/\/api\/v1\.3\/users\/([a-f0-9-]{36})/i);
      if (match) userId = match[1];
    }

    if (!userId) {
      setTimeout(proactiveFetch, 2000);
      return;
    }

    proactiveDone = true;

    var apiUrl = "https://www.bandlab.com/api/v1.3/users/" + userId + "/songs?limit=100&bandlab-tools-request=true";
    var totalCount = 0;
    var proactiveSongs = [];

    function fetchPage(url) {
      fetch(url, { credentials: "include" })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          if (data.data && Array.isArray(data.data)) {
            totalCount += data.data.length;
            data.data.forEach(function (song) {
              if (song.id && song.name) proactiveSongs.push({ id: song.id, name: song.name });
            });
          }

          var xpath = "/html/body/main/div/div[2]/div[1]/nav/ul[2]";
          var result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          var ref = result.singleNodeValue;

          if (ref && ref.parentNode) {
            var cd = document.getElementById("bandlab-tools-project-count");
            if (!cd) {
              cd = document.createElement("div");
              cd.id = "bandlab-tools-project-count";
              cd.style.cssText = "padding:10px 20px;color:#999;font-size:14px;font-weight:500;border-top:1px solid #333;margin-top:10px;display:flex;align-items:center;justify-content:center;";
              if (ref.nextSibling) ref.parentNode.insertBefore(cd, ref.nextSibling);
              else ref.parentNode.appendChild(cd);
            }
            var hasMore = data.paging && data.paging.cursors && data.paging.cursors.after;
            cd.innerHTML = "Total Projects: " + totalCount + (hasMore ? '<span class="bandlab-tools-spinner"></span>' : "");
          }

          if (data.paging && data.paging.cursors && data.paging.cursors.after) {
            var nextUrl = new URL(apiUrl, window.location.origin);
            nextUrl.searchParams.set("after", data.paging.cursors.after);
            nextUrl.searchParams.set("limit", "100");
            nextUrl.searchParams.set("bandlab-tools-request", "true");
            setTimeout(function () { fetchPage(nextUrl.toString()); }, 200);
          } else {
            window.postMessage({ type: "BANDLAB_TOOLS_SONGS_DATA", songs: proactiveSongs, headers: {} }, "*");
          }
        })
        .catch(function () {});
    }

    fetchPage(apiUrl);
  }

  setTimeout(proactiveFetch, 3000);
  setTimeout(proactiveFetch, 6000);
  setTimeout(proactiveFetch, 10000);
})();