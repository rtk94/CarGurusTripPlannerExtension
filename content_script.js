(function() {
    function injectSyncButton() {
        if (document.getElementById("cg-sync-btn")) return;
        
        const btn = document.createElement("button");
        btn.id = "cg-sync-btn";
        btn.innerHTML = "🚀 Sync to Nikki Map";
        btn.style.cssText = "position: fixed; top: 100px; right: 20px; z-index: 9999; padding: 12px 20px; background-color: #1a73e8; color: white; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-weight: bold;";

        btn.onclick = function() {
            btn.innerHTML = "⏳ Syncing...";
            
            // Inject a script to get window.__remixContext
            const script = document.createElement("script");
            script.textContent = `
                (function() {
                    window.dispatchEvent(new CustomEvent("CG_SYNC_DATA", { detail: window.__remixContext }));
                })();
            `;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        };

        document.body.appendChild(btn);
    }

    window.addEventListener("CG_SYNC_DATA", function(e) {
        const data = e.detail;
        chrome.runtime.sendMessage({ action: "SYNC_CARS", data: data }, function(response) {
            const btn = document.getElementById("cg-sync-btn");
            if (response && response.status === "success") {
                btn.innerHTML = "✅ Map Updated!";
                btn.style.backgroundColor = "#2e7d32";
                setTimeout(() => {
                    btn.innerHTML = "🚀 Sync to Nikki Map";
                    btn.style.backgroundColor = "#1a73e8";
                }, 3000);
            } else {
                btn.innerHTML = "❌ Error Syncing";
                btn.style.backgroundColor = "#d32f2f";
            }
        });
    });

    setTimeout(injectSyncButton, 2000);
})();
