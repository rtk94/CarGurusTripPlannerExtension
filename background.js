function showToast(message, type = "info") {
    let toast = document.getElementById("cg-trip-planner-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cg-trip-planner-toast";
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.padding = "12px 20px";
        toast.style.borderRadius = "8px";
        toast.style.color = "#fff";
        toast.style.fontFamily = "sans-serif";
        toast.style.fontSize = "14px";
        toast.style.zIndex = "999999";
        toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        toast.style.transition = "opacity 0.3s";
        document.body.appendChild(toast);
    }
    
    if (type === "info") toast.style.backgroundColor = "#1a73e8";
    if (type === "error") toast.style.backgroundColor = "#d93025";
    if (type === "success") toast.style.backgroundColor = "#188038";
    
    toast.innerText = message;
    toast.style.opacity = "1";
    
    if (type !== "info") {
        setTimeout(() => { toast.style.opacity = "0"; }, 3000);
    }
}

chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url && tab.url.includes("cargurus.com/Cars/myAccount/saved-listings")) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: showToast,
                args: ["Syncing your saved cars...", "info"]
            });

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                world: "MAIN",
                func: () => window.__remixContext
            });

            if (results && results[0] && results[0].result) {
                const numCars = await processAndSaveData(results[0].result);
                if (numCars > 0) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: showToast,
                        args: [`Success! Synced ${numCars} cars. Opening dashboard...`, "success"]
                    });
                    setTimeout(() => {
                        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
                    }, 800);
                } else {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: showToast,
                        args: ["No saved cars found on this page.", "error"]
                    });
                }
            } else {
                throw new Error("Could not extract data from the page.");
            }
        } catch (err) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: showToast,
                args: ["Error syncing cars. Please refresh the page and try again.", "error"]
            });
        }
    } else {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: showToast,
                args: ["Please navigate to your CarGurus 'Saved Cars' page to use this extension.", "error"]
            });
        } catch (e) {
            // Can't inject toast (e.g. on new tab page), fallback to just creating the dashboard directly
            chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
        }
    }
});

async function processAndSaveData(raw) {
    let listings = [];
    if (Array.isArray(raw)) {
        listings = raw;
    } else if (raw && raw.state && raw.state.loaderData) {
        const routeData = raw.state.loaderData["./routes/saved-listings/route"];
        if (routeData && routeData.savedListings) {
            listings = routeData.savedListings;
        }
    }

    if (listings.length === 0) return 0;

    let newCars = {};

    listings.forEach(item => {
        const id = String(item.id);
        if (!id) return;

        // --- IMPROVED IMAGE EXTRACTION ---
        let image_url = "";
        if (item.imageCarouselPictures && item.imageCarouselPictures.length > 0) {
            image_url = item.imageCarouselPictures[0].url;
        } else if (item.originalPictureData && item.originalPictureData.url) {
            image_url = item.originalPictureData.url;
        } else if (item.mainPictureData && item.mainPictureData.url) {
            image_url = item.mainPictureData.url;
        } else if (item.pictureUrl) {
            image_url = item.pictureUrl;
        }

        const link = "https://www.cargurus.com/Cars/listing/" + id;
        
        // --- IMPROVED ADDRESS CLEANUP ---
        let address = "";
        const sellerName = item.serviceProviderName || "";
        
        if (item.serviceProviderMapsUrl) {
             try {
                const url = new URL(item.serviceProviderMapsUrl);
                const params = new URLSearchParams(url.search);
                let dest = params.get("destination") || "";
                
                // Remove redundant seller name from destination string
                if (dest && sellerName && dest.toLowerCase().startsWith(sellerName.toLowerCase())) {
                    dest = dest.substring(sellerName.length).trim();
                    // Sometimes there is a leftover space or comma
                    if (dest.startsWith(",") || dest.startsWith(" ")) dest = dest.substring(1).trim();
                }
                address = dest;
             } catch(e) {}
        }

        newCars[id] = {
            ID: id,
            Year: item.year || "",
            Make: item.make || "",
            Model: item.model || "",
            Trim: item.trim || "",
            Price: item.priceString || "",
            Mileage: item.mileageString || "",
            Location: item.cityRegion || "",
            Seller: sellerName,
            SellerPhone: item.serviceProviderPhone || "",
            SellerAddress: address,
            SellerRating: item.sellerRating || "N/A",
            MapsUrl: item.serviceProviderMapsUrl || "",
            Distance: item.distance ? Math.round(item.distance * 10) / 10 : "",
            ImageURL: image_url,
            Link: link,
            SavedDate: item.savedDateTime ? item.savedDateTime.split("T")[0] : "",
            DealRating: item.dealRating || "NA",
            DaysOnMarket: item.daysOnMarket || 0
        };
    });

    // Clear old storage and save new cars to prevent phantom cars
    await chrome.storage.local.clear();
    await chrome.storage.local.set({ cars: newCars });
    
    return Object.keys(newCars).length;
}