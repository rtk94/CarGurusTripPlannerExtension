chrome.action.onClicked.addListener(async (tab) => {
    // If we're on the saved listings page, sync and open dashboard
    if (tab.url && tab.url.includes("cargurus.com/Cars/myAccount/saved-listings")) {
        try {
            // Execute script in the page to get window.__remixContext
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                world: 'MAIN',
                func: () => window.__remixContext
            });

            if (results && results[0] && results[0].result) {
                await processAndSaveData(results[0].result);
                // Open dashboard
                chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
            } else {
                console.error("Could not find car data on the page.");
                // Still open dashboard so they can see existing data
                chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
            }
        } catch (err) {
            console.error("Failed to sync:", err);
            chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
        }
    } else {
        // Just open the dashboard if we're not on the CarGurus page
        chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    }
});

async function processAndSaveData(raw) {
    let listings = [];
    if (Array.isArray(raw)) {
        listings = raw;
    } else if (raw && raw.state && raw.state.loaderData) {
        const routeData = raw.state.loaderData['./routes/saved-listings/route'];
        if (routeData && routeData.savedListings) {
            listings = routeData.savedListings;
        }
    }

    if (listings.length === 0) return;

    const result = await chrome.storage.local.get(['cars']);
    let existingCars = result.cars || {};

    listings.forEach(item => {
        const id = String(item.id);
        if (!id) return;

        let image_url = '';
        if (item.imageCarouselPictures && item.imageCarouselPictures.length > 0) {
            image_url = item.imageCarouselPictures[0].url;
        } else if (item.originalPictureData) {
            image_url = item.originalPictureData.url;
        }

        const link = 'https://www.cargurus.com/Cars/forsale/viewListing.action?listingId=' + id;
        
        existingCars[id] = {
            ID: id,
            Year: item.year || '',
            Make: item.make || '',
            Model: item.model || '',
            Trim: item.trim || '',
            Price: item.priceString || '',
            Mileage: item.mileageString || '',
            Location: item.cityRegion || '',
            Seller: item.serviceProviderName || '',
            Distance: item.distance ? Math.round(item.distance * 10) / 10 : '',
            ImageURL: image_url,
            Link: link,
            SavedDate: item.savedDateTime ? item.savedDateTime.split('T')[0] : ''
        };
    });

    await chrome.storage.local.set({ cars: existingCars });
}
