chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url && tab.url.includes("cargurus.com/Cars/myAccount/saved-listings")) {
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                world: "MAIN",
                func: () => window.__remixContext
            });

            if (results && results[0] && results[0].result) {
                await processAndSaveData(results[0].result);
                chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
            } else {
                chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
            }
        } catch (err) {
            chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
        }
    } else {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
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

    if (listings.length === 0) return;

    let newCars = {};

    listings.forEach(item => {
        const id = String(item.id);
        if (!id) return;

        let image_url = "";
        if (item.imageCarouselPictures && item.imageCarouselPictures.length > 0) {
            image_url = item.imageCarouselPictures[0].url;
        } else if (item.originalPictureData) {
            image_url = item.originalPictureData.url;
        }

        const link = "https://www.cargurus.com/Cars/listing/" + id;
        
        // Extracting address from Maps URL if possible
        let address = "";
        if (item.serviceProviderMapsUrl) {
             try {
                const url = new URL(item.serviceProviderMapsUrl);
                const params = new URLSearchParams(url.search);
                address = params.get("destination") || "";
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
            Seller: item.serviceProviderName || "",
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

    await chrome.storage.local.set({ cars: newCars });
}