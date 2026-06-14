let map, markerObjects = [], activeId = null;
let routeStops = [];
let darkLayer, lightLayer, currentLayer;
let currentFilters = {
    minPrice: 0, maxPrice: 999999,
    maxMiles: 999999,
    minYear: 0, maxYear: 2030,
    dealRating: ""
};

function formatAddress(addr) {
    if (!addr) return "N/A";
    const parts = addr.split(",");
    if (parts.length > 2) {
        return parts[0].trim() + "<br>" + parts.slice(1).join(", ").trim();
    }
    return addr;
}

function formatPhone(phone) {
    if (!phone) return "N/A";
    const cleaned = ("" + phone).replace(/\D/g, "");
    const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return "(" + match[2] + ") " + match[3] + "-" + match[4];
    }
    return phone;
}

async function init() {
    L.Icon.Default.imagePath = "../assets/images/";
    map = L.map("map").setView([39.8283, -98.5795], 4); // Center of US
    
    lightLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; CARTO", subdomains: "abcd", maxZoom: 20
    });
    darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; CARTO", subdomains: "abcd", maxZoom: 20
    });
    
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        document.getElementById("theme-toggle").innerText = "☀️";
        currentLayer = darkLayer;
    } else {
        currentLayer = lightLayer;
    }
    currentLayer.addTo(map);

    const result = await chrome.storage.local.get(["cars"]);
    const cars = Object.values(result.cars || {}).sort((a, b) => b.Year - a.Year);
    
    if (cars.length > 0 && cars[0].rawPayload) {
        console.log("DEBUG: RAW CARGURUS PAYLOAD:", cars[0].rawPayload);
    }

    cars.forEach((car) => {
        // Geocode using US_CITIES from assets/cities.js
        let coords = [39.95, -75.16]; // Fallback
        if (typeof US_CITIES !== 'undefined') {
            const locKey = car.Location ? car.Location.replace(", ", ",") : "";
            const directMatch = US_CITIES[locKey];
            if (directMatch) {
                coords = directMatch;
            } else if (car.Location && US_CITIES[car.Location]) {
                coords = US_CITIES[car.Location];
            } else {
                // Try just the city name as fallback
                const cityOnly = car.Location ? car.Location.split(",")[0] : "";
                const possibleKey = Object.keys(US_CITIES).find(k => k.startsWith(cityOnly + ","));
                if (possibleKey) coords = US_CITIES[possibleKey];
            }
        }
        
        const jittered = [coords[0] + (Math.random()-0.5)*0.015, coords[1] + (Math.random()-0.5)*0.015];
        
        const popupContent = `
            <div class="car-popup">
                <img src="${car.ImageURL || "https://via.placeholder.com/200x150?text=No+Image"}">
                <h3>${car.Year} ${car.Make} ${car.Model}</h3>
                <p class="price">${car.Price} <span style="font-size:11px; font-weight:bold; color:white; background:${getDealColor(car.DealRating)}; padding:2px 6px; border-radius:4px; margin-left:6px; vertical-align:middle;">${formatDealRating(car.DealRating)}</span></p>
                <p>${car.Mileage} mi • ${car.GasMileage || "N/A"}</p>
                <div class="seller-info">
                    <p><b>${car.Seller}</b> <span style="color:#fbbc04;">★ ${car.SellerRating || "N/A"}</span></p>
                    <p>${formatAddress(car.SellerAddress || car.Location)}</p>
                    <p>${formatPhone(car.SellerPhone)}</p>
                </div>
                <a href="${car.MapsUrl}" target="_blank" class="popup-btn">📍 Navigate</a>
                <a href="${car.Link}" target="_blank" class="popup-btn">🔗 View Listing</a>
            </div>`;
        
        const marker = L.marker(jittered).addTo(map).bindPopup(popupContent);
        marker.on("click", () => {
            const card = document.getElementById("card-" + car.ID);
            if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
            setActive(car.ID);
        });
        
        markerObjects.push({ marker, car, visible: true });
    });

    renderList();

    document.getElementById("search-input").addEventListener("input", renderList);
    document.getElementById("filter-toggle-link").addEventListener("click", toggleFilterPanel);
    document.getElementById("btn-filter-apply").addEventListener("click", applyFilters);
    document.getElementById("btn-filter-clear").addEventListener("click", clearFilters);
    document.getElementById("export-csv").addEventListener("click", exportCSV);
    document.getElementById("btn-start-route").addEventListener("click", startRoute);
    document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
}

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("theme-toggle").innerText = isDark ? "☀️" : "🌙";
    
    map.removeLayer(currentLayer);
    currentLayer = isDark ? darkLayer : lightLayer;
    currentLayer.addTo(map);
}

function toggleFilterPanel() {
    const panel = document.getElementById("filter-panel");
    const link = document.getElementById("filter-toggle-link");
    const isHidden = window.getComputedStyle(panel).display === "none";
    panel.style.display = isHidden ? "block" : "none";
    link.innerText = isHidden ? "Hide Filters ▲" : "Filter Results ▼";
}

function applyFilters() {
    currentFilters.minPrice = parseInt(document.getElementById("f-min-price").value) || 0;
    currentFilters.maxPrice = parseInt(document.getElementById("f-max-price").value) || 999999;
    currentFilters.maxMiles = parseInt(document.getElementById("f-max-miles").value) || 999999;
    currentFilters.minYear = parseInt(document.getElementById("f-min-year").value) || 0;
    currentFilters.maxYear = parseInt(document.getElementById("f-max-year").value) || 2030;
    currentFilters.dealRating = document.getElementById("f-deal").value;
    
    toggleFilterPanel();
    renderList();
}

function clearFilters() {
    document.getElementById("f-min-price").value = "";
    document.getElementById("f-max-price").value = "";
    document.getElementById("f-max-miles").value = "";
    document.getElementById("f-min-year").value = "";
    document.getElementById("f-max-year").value = "";
    document.getElementById("f-deal").value = "";
    
    currentFilters = { minPrice: 0, maxPrice: 999999, maxMiles: 999999, minYear: 0, maxYear: 2030, dealRating: "" };
    renderList();
}

function formatDealRating(deal) {
    if (!deal || deal === "NA") return "N/A";
    return deal.replace("_PRICE", "").replace("_", " ");
}

function getDealColor(deal) {
    switch(deal) {
        case "GREAT_PRICE": return "#188038"; // Green
        case "GOOD_PRICE": return "#1e8e3e"; // Light Green
        case "FAIR_PRICE": return "#f29900"; // Orange
        case "HIGH_PRICE": return "#d93025"; // Red
        default: return "#5f6368"; // Gray
    }
}

function parseNumeric(str) {
    if (!str) return 0;
    return parseInt(str.replace(/[^0-9]/g, "")) || 0;
}

function renderList() {
    const list = document.getElementById("car-list");
    list.innerHTML = "";
    const query = document.getElementById("search-input").value.toLowerCase();
    const visibleMarkers = [];

    markerObjects.forEach((obj) => {
        const c = obj.car;
        const priceNum = parseNumeric(c.Price);
        const milesNum = parseNumeric(c.Mileage);
        
        const matchesText = c.Make.toLowerCase().includes(query) || c.Model.toLowerCase().includes(query) || 
                            c.Year.toString().includes(query) || c.Location.toLowerCase().includes(query);
        
        const matchesFilters = priceNum >= currentFilters.minPrice && priceNum <= currentFilters.maxPrice &&
                               milesNum <= currentFilters.maxMiles &&
                               c.Year >= currentFilters.minYear && c.Year <= currentFilters.maxYear &&
                               (currentFilters.dealRating === "" || c.DealRating === currentFilters.dealRating);

        if (matchesText && matchesFilters) {
            const isRouted = routeStops.some(s => s.id === c.ID);
            const dealText = formatDealRating(c.DealRating);
            const dealColor = getDealColor(c.DealRating);
            const card = document.createElement("div");
            card.id = "card-" + c.ID;
            card.className = "car-card" + (obj.visible ? "" : " hidden") + (activeId === c.ID ? " active" : "");
            
            card.innerHTML = `
                <input type="checkbox" class="visibility-toggle" ${obj.visible ? "checked" : ""}>
                <div class="card-main">
                    <div class="card-thumb">
                        <img src="${c.ImageURL || "https://via.placeholder.com/200x150?text=No+Image"}" alt="Car">
                    </div>
                    <div class="card-info">
                        <h4>${c.Year} ${c.Make} ${c.Model}</h4>
                        <div class="price">${c.Price} <span style="font-size:10px; font-weight:bold; color:white; background:${dealColor}; padding:2px 6px; border-radius:12px; margin-left:6px; vertical-align:middle;">${dealText}</span></div>
                        <div class="meta">${c.Mileage} mi • ${c.Location}</div>
                    </div>
                </div>
                <div class="card-details">
                    <div class="card-details-grid">
                        <div class="detail-item"><span class="label">Trim</span><span class="val ${!c.Trim ? 'na' : ''}">${c.Trim || 'N/A'}</span></div>
                        <div class="detail-item"><span class="label">Transmission</span><span class="val ${(!c.Transmission || c.Transmission === 'N/A') ? 'na' : ''}">${c.Transmission || "N/A"}</span></div>
                        <div class="detail-item"><span class="label">MPG</span><span class="val ${(!c.GasMileage || c.GasMileage === 'N/A') ? 'na' : ''}">${c.GasMileage || "N/A"}</span></div>
                        <div class="detail-item"><span class="label">Distance</span><span class="val">${c.Distance} mi</span></div>
                        <div class="detail-item"><span class="label">Market Days</span><span class="val">${c.DaysOnMarket}</span></div>
                        <div class="detail-item"><span class="label">Address</span><span class="val">${formatAddress(c.SellerAddress)}</span></div>
                        <div class="detail-item"><span class="label">Seller</span><span class="val">${c.Seller}</span></div>
                        <div class="detail-item"><span class="label">Rating</span><span class="val ${(!c.SellerRating || c.SellerRating === 'N/A') ? 'na' : ''}" style="${c.SellerRating !== 'N/A' ? 'color:#f59e0b;' : ''}">${c.SellerRating !== 'N/A' ? '★ ' + c.SellerRating : 'N/A'}</span></div>
                    </div>
                    <div style="border-top:1px solid #e4e4e7; margin-top:8px; padding-top:8px; display:flex; gap:12px;" class="history-row">
                        <div class="detail-item"><span class="label">Title</span><span class="val ${(!c.TitleStatus || c.TitleStatus === 'N/A') ? 'na' : ''}">${c.TitleStatus || "N/A"}</span></div>
                        <div class="detail-item"><span class="label">Accidents</span><span class="val ${(!c.Accidents || c.Accidents === 'N/A') ? 'na' : ''}">${c.Accidents || "N/A"}</span></div>
                        <div class="detail-item"><span class="label">Owners</span><span class="val ${(!c.Owners || c.Owners === 'N/A') ? 'na' : ''}">${c.Owners || "N/A"}</span></div>
                    </div>
                    
                    <div class="card-actions-row">
                        <button class="btn-enrich" data-id="${c.ID}">⚡ Enrich</button>
                        <button class="btn-add-route ${isRouted ? 'added' : ''}" data-id="${c.ID}">${isRouted ? '✓ Added' : '➕ Route'}</button>
                        <a href="${c.MapsUrl}" class="icon-btn" target="_blank" title="Open Navigation">📍</a>
                        <a href="${c.Link}" class="icon-btn" target="_blank" title="View on CarGurus">🔗</a>
                    </div>
                </div>
            `;
            
            card.querySelector(".btn-enrich").onclick = (e) => {
                e.stopPropagation();
                enrichCarData(c.ID, e.target);
            };
            
            card.querySelector(".visibility-toggle").onclick = (e) => {
                e.stopPropagation();
                obj.visible = e.target.checked;
                renderList();
            };

            card.querySelector(".btn-add-route").onclick = (e) => {
                e.stopPropagation();
                toggleRouteStop(c);
            };
            
            card.onclick = () => {
                setActive(c.ID);
                map.setView(obj.marker.getLatLng(), 14);
                obj.marker.openPopup();
            };
            
            list.appendChild(card);
            
            if (obj.visible) {
                obj.marker.addTo(map);
                visibleMarkers.push(obj.marker);
            } else {
                map.removeLayer(obj.marker);
            }
        } else {
            map.removeLayer(obj.marker);
        }
    });

    if (document.getElementById("autocenter-toggle").checked && visibleMarkers.length > 0) {
        const group = new L.featureGroup(visibleMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function setActive(id) {
    activeId = id;
    const cards = document.querySelectorAll(".car-card");
    cards.forEach(c => c.classList.remove("active"));
    const activeCard = document.getElementById("card-" + id);
    if (activeCard) activeCard.classList.add("active");
}

function toggleRouteStop(car) {
    const idx = routeStops.findIndex(s => s.id === car.ID);
    if (idx >= 0) {
        routeStops.splice(idx, 1);
    } else {
        routeStops.push({
            id: car.ID,
            title: `${car.Year} ${car.Make} ${car.Model}`,
            address: car.SellerAddress || car.Location
        });
    }
    updateRoutePanel();
    renderList(); // re-render to update button state
}

function removeRouteStop(id) {
    routeStops = routeStops.filter(s => s.id !== id);
    updateRoutePanel();
    renderList();
}

function updateRoutePanel() {
    const container = document.getElementById("route-stops");
    const startBtn = document.getElementById("btn-start-route");
    
    if (routeStops.length === 0) {
        container.innerHTML = "No stops added yet. Click 'Add to Route' on a car.";
        startBtn.style.display = "none";
        return;
    }
    
    container.innerHTML = "";
    routeStops.forEach((stop, index) => {
        const div = document.createElement("div");
        div.className = "route-stop-item";
        
        const textSpan = document.createElement("span");
        textSpan.innerHTML = `<b>${index + 1}.</b> ${stop.title}`;
        
        const removeSpan = document.createElement("span");
        removeSpan.className = "remove-stop";
        removeSpan.innerText = "✕";
        
        // Attach listener via JS to comply with Chrome Extension CSP
        removeSpan.addEventListener("click", () => {
            removeRouteStop(stop.id);
        });
        
        div.appendChild(textSpan);
        div.appendChild(removeSpan);
        container.appendChild(div);
    });
    
    startBtn.style.display = "block";
}

// Make removeRouteStop global so inline onclick works
window.removeRouteStop = removeRouteStop;

function startRoute() {
    if (routeStops.length === 0) return;
    
    // Google Maps multi-stop URL
    const baseUrl = "https://www.google.com/maps/dir/Current+Location/";
    const stops = routeStops.map(s => encodeURIComponent(s.address)).join("/");
    window.open(baseUrl + stops, "_blank");
}

function exportCSV() {
    const cars = markerObjects.map(o => o.car);
    if (cars.length === 0) return;
    const headers = Object.keys(cars[0]).join(",");
    const rows = cars.map(c => Object.values(c).map(v => "\"" + v + "\"").join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cars_export.csv";
    a.click();
}

function findNestedKey(obj, key) {
    if (typeof obj !== 'object' || obj === null) return undefined;
    if (key in obj) return obj[key];
    for (let k in obj) {
        const result = findNestedKey(obj[k], key);
        if (result !== undefined) return result;
    }
    return undefined;
}

async function enrichCarData(id, btn) {
    btn.innerText = "⏳ Loading...";
    btn.disabled = true;
    
    try {
        const res = await fetch(`https://www.cargurus.com/Cars/listing/${id}`);
        const text = await res.text();
        
        const match = text.match(/window\.__remixContext\s*=\s*(\{[\s\S]+?\});?\s*<\/script>/);
        if (match && match[1]) {
            const data = JSON.parse(match[1]);
            
            const transmission = findNestedKey(data, "transmission") || findNestedKey(data, "transmissionType") || "N/A";
            const combinedMpg = findNestedKey(data, "combinedMpg");
            const cityMpg = findNestedKey(data, "cityMpg");
            const highwayMpg = findNestedKey(data, "highwayMpg");
            const mpg = combinedMpg ? combinedMpg : (cityMpg ? `${cityMpg} City / ${highwayMpg} Hwy` : "N/A");
            
            const sellerRating = findNestedKey(data, "sellerRating") || findNestedKey(data, "serviceProviderRating") || findNestedKey(data, "rating") || "N/A";
            const titleStatus = findNestedKey(data, "titleStatus") || "N/A";
            const accidents = findNestedKey(data, "accidentCount") || findNestedKey(data, "accidentsReported") || "0";
            const owners = findNestedKey(data, "ownerCount") || findNestedKey(data, "owners") || "N/A";

            const storage = await chrome.storage.local.get(["cars"]);
            if (storage.cars && storage.cars[id]) {
                storage.cars[id].Transmission = transmission;
                storage.cars[id].GasMileage = mpg;
                storage.cars[id].SellerRating = sellerRating;
                storage.cars[id].TitleStatus = titleStatus;
                storage.cars[id].Accidents = accidents;
                storage.cars[id].Owners = owners;
                
                await chrome.storage.local.set({ cars: storage.cars });
                
                const obj = markerObjects.find(o => o.car.ID == id);
                if (obj) obj.car = storage.cars[id];
                
                renderList();
            }
        } else {
            alert("Could not extract data from the listing page.");
            btn.innerText = "⚡ Enrich Data";
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Failed to fetch data.");
        btn.innerText = "⚡ Enrich Data";
        btn.disabled = false;
    }
}

init();