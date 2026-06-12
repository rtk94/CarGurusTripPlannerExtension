chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SYNC_CARS') {
        processAndSaveData(message.data)
            .then(() => {
                chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
                sendResponse({ status: 'success' });
            })
            .catch(err => {
                console.error(err);
                sendResponse({ status: 'error', error: err.message });
            });
        return true; // Keep channel open for async
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

    if (listings.length === 0) throw new Error('No listings found');

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
