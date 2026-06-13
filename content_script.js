(function() {
    function injectSyncButton() {
        if (document.getElementById("cg-sync-btn")) return;
        
        const btn = document.createElement("button");
        btn.id = "cg-sync-btn";
        btn.innerHTML = "🚀 Sync to Car Map";
        btn.style.cssText = "position: fixed; top: 120px; right: 20px; z-index: 999999; padding: 14px 24px; background-color: #1a73e8; color: white; border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.4); font-weight: bold; font-family: sans-serif;";

        btn.onclick = function() {
            btn.innerHTML = "⏳ Syncing...";
            
            const script = document.createElement("script");
            script.textContent = `
                (function() {
                    if (window.__remixContext) {
                        window.dispatchEvent(new CustomEvent("CG_SYNC_DATA", { detail: window.__remixContext }));
                    } else {
                        window.dispatchEvent(new CustomEvent("CG_SYNC_DATA", { detail: null }));
                    }
                })();
            `;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        };

        document.body.appendChild(btn);
    }

    window.addEventListener("CG_SYNC_DATA", function(e) {
        if (!e.detail) {
            alert("Could not find car data on this page. Make sure you are on the Saved Cars page.");
            document.getElementById("cg-sync-btn").innerHTML = "🚀 Sync to Car Map";
            return;
        }

        chrome.runtime.sendMessage({ action: "SYNC_CARS", data: e.detail }, function(response) {
            const btn = document.getElementById("cg-sync-btn");
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                btn.innerHTML = "❌ Extension Error";
                return;
            }
            
            if (response && response.status === "success") {
                btn.innerHTML = "✅ Map Updated!";
                btn.style.backgroundColor = "#2e7d32";
                setTimeout(() => {
                    btn.innerHTML = "🚀 Sync to Car Map";
                    btn.style.backgroundColor = "#1a73e8";
                }, 3000);
            } else {
                btn.innerHTML = "❌ Error Syncing";
                btn.style.backgroundColor = "#d32f2f";
            }
        });
    });

    injectSyncButton();
    setInterval(injectSyncButton, 3000);
})();