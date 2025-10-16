(() => {
  let membershipBypassEnabled = true;
  let consoleLoggingEnabled = true;

  window.addEventListener("message", (event) => {
    if (event.data.type === "BANDLAB_TOOLS_SETTINGS") {
      membershipBypassEnabled = event.data.settings.membershipBypass;
      consoleLoggingEnabled = event.data.settings.consoleLogging;

      if (consoleLoggingEnabled) {
        console.log(
          "%c[BandLab-Tools] Settings updated",
          "background: #667eea; color: #fff; padding: 2px 5px;",
          event.data.settings
        );
      }
    }
  });

  const SPOOF_BODY = {
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
    startedOn: "2025-09-13T03:03:20Z",
  };

  const SPOOF_JSON = JSON.stringify(SPOOF_BODY);
  const PATH_PATTERN =
    /^\/api\/v1\.3\/users\/[^/]+\/membership-plan(?:\/)?(?:\?.*)?$/;

  function isTargetUrl(urlString) {
    if (typeof urlString !== "string") return false;
    if (urlString.indexOf("membership-plan") === -1) return false;
    if (urlString.indexOf("/api/v1.3/users/") === -1) return false;

    try {
      const url = new URL(urlString, "https://www.bandlab.com");
      return (
        url.host.endsWith("bandlab.com") && PATH_PATTERN.test(url.pathname)
      );
    } catch {
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
        "content-length": SPOOF_JSON.length.toString(),
      }),
      text: async () => SPOOF_JSON,
      json: async () => SPOOF_BODY,
      clone: function () {
        return this;
      },
    };
  }

  const originalFetch = window.fetch;
  window.fetch = function (resource, config) {
    const urlString = typeof resource === "string" ? resource : resource.url;

    if (isTargetUrl(urlString)) {
      if (!membershipBypassEnabled) {
        return originalFetch.apply(this, arguments);
      }

      if (consoleLoggingEnabled) {
        console.log(
          "%c[BandLab-Tools] ✓ INTERCEPTED membership-plan",
          "background: #00ff00; color: #000; font-weight: bold; padding: 2px 5px;",
          urlString
        );
      }
      return Promise.resolve(createSpoofResponse());
    }

    return originalFetch.apply(this, arguments);
  };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._targetUrl = url;
    return originalXhrOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (isTargetUrl(this._targetUrl)) {
      if (!membershipBypassEnabled) {
        return originalXhrSend.apply(this, arguments);
      }

      if (consoleLoggingEnabled) {
        console.log(
          "%c[BandLab-Tools] ✓ INTERCEPTED membership-plan (XHR)",
          "background: #00ff00; color: #000; font-weight: bold; padding: 2px 5px;",
          this._targetUrl
        );
      }

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

  if (consoleLoggingEnabled) {
    console.log("[BandLab-Tools] Interceptor ready");
  }
})();
