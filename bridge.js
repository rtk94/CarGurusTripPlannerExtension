// This script runs in the ISOLATED world (standard content script)
// It catches the message from the MAIN world and forwards it to the extension background.
window.addEventListener("message", function(event) {
    if (event.source !== window || !event.data || event.data.type !== "CG_SYNC_DATA_REQUEST") return;

    chrome.runtime.sendMessage({ action: "SYNC_CARS", data: event.data.data }, function(response) {
        // We could send a message back to MAIN to update button state if needed
    });
});
