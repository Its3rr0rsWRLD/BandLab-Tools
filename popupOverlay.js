(function () {
  // Toggle popup if it already exists
  var existing = document.getElementById("bandlab-tools-overlay");
  if (existing) {
    var backdrop = document.getElementById("bandlab-tools-backdrop");
    var style = document.getElementById("bandlab-tools-overlay-style");
    if (existing) existing.remove();
    if (backdrop) backdrop.remove();
    if (style) style.remove();
    return;
  }

  // Inject styles into <head>
  var style = document.createElement("style");
  style.id = "bandlab-tools-overlay-style";
  style.textContent =
    "#bandlab-tools-overlay {" +
    "  position: fixed;" +
    "  top: 10px;" +
    "  right: 10px;" +
    "  z-index: 2147483647;" +
    "  width: 500px;" +
    "  height: 640px;" +
    "  border-radius: 20px;" +
    "  overflow: hidden;" +
    "  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 10px 30px rgba(0, 0, 0, 0.3);" +
    "  animation: bandlab-tools-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);" +
    "  border: 1px solid rgba(255, 255, 255, 0.12);" +
    "}" +
    "#bandlab-tools-overlay iframe {" +
    "  width: 100%;" +
    "  height: 100%;" +
    "  border: none;" +
    "  border-radius: 20px;" +
    "}" +
    "#bandlab-tools-backdrop {" +
    "  position: fixed;" +
    "  top: 0;" +
    "  left: 0;" +
    "  right: 0;" +
    "  bottom: 0;" +
    "  z-index: 2147483646;" +
    "  background: rgba(0, 0, 0, 0.15);" +
    "}" +
    "@keyframes bandlab-tools-slide-in {" +
    "  from { opacity: 0; transform: translateY(-10px) scale(0.96); }" +
    "  to { opacity: 1; transform: translateY(0) scale(1); }" +
    "}";
  document.head.appendChild(style);

  // Create backdrop (click outside to close)
  var backdrop = document.createElement("div");
  backdrop.id = "bandlab-tools-backdrop";
  backdrop.addEventListener("click", function () {
    var overlay = document.getElementById("bandlab-tools-overlay");
    var bd = document.getElementById("bandlab-tools-backdrop");
    var st = document.getElementById("bandlab-tools-overlay-style");
    if (overlay) overlay.remove();
    if (bd) bd.remove();
    if (st) st.remove();
  });

  // Create popup container with iframe
  var overlay = document.createElement("div");
  overlay.id = "bandlab-tools-overlay";

  var iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("popup.html");
  iframe.allow = "";

  overlay.appendChild(iframe);
  document.body.appendChild(backdrop);
  document.body.appendChild(overlay);
})();
