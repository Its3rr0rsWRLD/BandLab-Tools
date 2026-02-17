(() => {
  var membershipBypassEnabled = true;
  var consoleLoggingEnabled = true;

  window.BANDLAB_TOOLS_SETTINGS = {
    membershipBypass: false,
    consoleLogging: true,
    cleanInviteLinks: true,
    blockAnalytics: false,
    sony360Audio: false,
    harmonyEditorUnlock: true,
    fullExperimentals: false,
    totalProjects: true,
    playAllSongs: false
  };

  window.addEventListener("message", (event) => {
    if (event.data.type === "BANDLAB_TOOLS_SETTINGS") {
      membershipBypassEnabled = event.data.settings.membershipBypass;
      consoleLoggingEnabled = event.data.settings.consoleLogging;
      window.BANDLAB_TOOLS_SETTINGS = event.data.settings;
    }
  });

  var SPOOF_BODY = {
    availableFeatures: [],
    billingInterval: "Year",
    billingIssue: null,
    canceledOn: "2026-09-17T00:18:34Z",
    expiresOn: "2026-10-16T03:03:20Z",
    isRetentionDiscountAvailable: true,
    isTrial: false,
    isTrialAllowed: true,
    nextBillingInterval: "Month",
    nextPlan: "Paid",
    nextRenewalPrice: 14.95,
    paymentProvider: "AppleAppStore",
    plan: "Paid",
    priceCurrency: "USD",
    startedOn: "2025-09-13T03:03:20Z"
  };

  var SPOOF_JSON = JSON.stringify(SPOOF_BODY);
  var PATH_PATTERN = /^\/api\/v1\.3\/users\/[^/]+\/membership-plan(?:\/)?(?:\?.*)?$/;

  function isTargetUrl(urlString) {
    if (typeof urlString !== "string") return false;
    if (urlString.indexOf("membership-plan") === -1) return false;
    if (urlString.indexOf("/api/v1.3/users/") === -1) return false;
    try {
      var url = new URL(urlString, "https://www.bandlab.com");
      return url.host.endsWith("bandlab.com") && PATH_PATTERN.test(url.pathname);
    } catch (e) {
      return false;
    }
  }

  function createSpoofResponse() {
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "content-length": SPOOF_JSON.length.toString()
      }),
      text: async () => SPOOF_JSON,
      json: async () => SPOOF_BODY,
      clone: function () { return this; }
    };
  }

  var originalFetch = window.fetch;

  window.fetch = function (resource, config) {
    var urlString = typeof resource === "string" ? resource : resource.url;
    if (isTargetUrl(urlString)) {
      if (!membershipBypassEnabled) return originalFetch.apply(this, arguments);
      return Promise.resolve(createSpoofResponse());
    }
    return originalFetch.apply(this, arguments);
  };

  var originalXhrOpen = XMLHttpRequest.prototype.open;
  var originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._targetUrl = url;
    return originalXhrOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (isTargetUrl(this._targetUrl)) {
      if (!membershipBypassEnabled) return originalXhrSend.apply(this, arguments);

      this.readyState = 4;
      this.status = 200;
      this.statusText = "OK";
      this.response = SPOOF_BODY;
      this.responseText = SPOOF_JSON;

      setTimeout(() => {
        this.dispatchEvent(new ProgressEvent("readystatechange"));
        this.dispatchEvent(new ProgressEvent("load"));
      }, 0);

      return;
    }
    return originalXhrSend.apply(this, arguments);
  };
})();