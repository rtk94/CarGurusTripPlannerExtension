(function() {
    // This script now runs in the MAIN world, meaning it has direct access to window.__remixContext
    // without needing to inject additional script tags that violate CSP.

    function injectSyncButton() {
        if (document.getElementById("cg-sync-btn")) return;
        
        const btn = document.createElement("button");
        btn.id = "cg-sync-btn";
        btn.innerHTML = "🚀 Sync to Car Map";
        btn.style.cssText = "position: fixed; top: 120px; right: 20px; z-index: 999999; padding: 14px 24px; background-color: #1a73e8; color: white; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); font-weight: bold; font-family: sans-serif;";

        btn.onclick = function() {
            btn.innerHTML = "⏳ Syncing...";
            
            const context = window.__remixContext;
            
            if (!context) {
                alert("Could not find car data on this page. Make sure you are on the Saved Cars page.");
                btn.innerHTML = "🚀 Sync to Car Map";
                return;
            }

            // In world: MAIN, we use a CustomEvent to send data back to the extension background
            // or we can try to use a specific extension ID if we had one.
            // Since we want to be generic, we will dispatch an event that a hidden ISOLATED script would catch,
            // OR we can just use standard messaging if the browser supports it from MAIN.
            // Actually, the most reliable way in Manifest V3 for MAIN -> Background is:
            window.postMessage({ type: "CG_SYNC_DATA_REQUEST", data: context }, "*");
        };

        document.body.appendChild(btn);
    }

    // Since this script is now in MAIN, we need a small bridge to talk to the extension
    // But wait, there is an even easier way. We can use world: MAIN for the button, 
    // and a separate script for the bridge. 
    // Actually, lets just use window.postMessage.
    
    injectSyncButton();
    setInterval(injectSyncButton, 3000);
})();
