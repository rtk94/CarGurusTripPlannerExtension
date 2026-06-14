const CITY_COORDS = {
    "Jackson, NJ": [40.0984, -74.3485], "Franklinville, NJ": [39.6165, -75.0760], "Bordentown, NJ": [40.1446, -74.7065],
    "Riverside, NJ": [40.0384, -74.9577], "Quakertown, PA": [40.4409, -75.3413], "Norristown, PA": [40.1215, -75.3399],
    "Pottstown, PA": [40.2454, -75.6496], "Bridgeton, NJ": [39.4273, -75.2341], "Sicklerville, NJ": [39.7212, -75.0007],
    "Wilmington, DE": [39.7447, -75.5484], "Lindenwold, NJ": [39.8243, -74.9913], "Pennsauken, NJ": [39.9537, -75.0538],
    "Maple Shade, NJ": [39.9454, -74.9963], "Burlington, NJ": [40.0712, -74.8649], "Woodbury, NJ": [39.8382, -75.1527],
    "Voorhees, NJ": [39.8512, -74.9654], "Mount Laurel, NJ": [39.9340, -74.8910], "Jenkintown, PA": [40.0957, -75.1235],
    "Bethlehem, PA": [40.6259, -75.3705], "Philadelphia, PA": [39.9526, -75.1652], "Lambertville, NJ": [40.3659, -74.9429],
    "Cherry Hill, NJ": [39.9348, -75.0307], "Marlton, NJ": [39.8912, -74.9182], "Blackwood, NJ": [39.8001, -75.0607],
    "Vineland, NJ": [39.4862, -75.0257], "Conshohocken, PA": [40.0793, -75.3016], "Sharon Hill, PA": [39.9048, -75.2671]
};

let map, markerObjects = [], activeId = null;
let currentFilters = {
    minPrice: 0, maxPrice: 999999,
    maxMiles: 999999,
    minYear: 0, maxYear: 2030,
    dealRating: ""
};

function formatAddress(addr) {
    if (!addr) return "N/A";
    // Usually formatted like "123 Main St, City, ST, Zip, US"
    // We want to try to break it after the street
    const parts = addr.split(",");
    if (parts.length > 2) {
        return parts[0].trim() + "<br>" + parts.slice(1).join(", ").trim();
    }
    return addr;
}

async function init() {
    L.Icon.Default.imagePath = "../assets/images/";
    map = L.map("map").setView([40.0, -75.0], 9);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; CARTO", subdomains: "abcd", maxZoom: 20
    }).addTo(map);

    const result = await chrome.storage.local.get(["cars"]);
    const cars = Object.values(result.cars || {}).sort((a, b) => b.Year - a.Year);

    cars.forEach((car) => {
        const coords = CITY_COORDS[car.Location] || [39.95, -75.16];
        const jittered = [coords[0] + (Math.random()-0.5)*0.015, coords[1] + (Math.random()-0.5)*0.015];
        
        const popupContent = `
            <div class="car-popup">
                <img src="${car.ImageURL || "https://via.placeholder.com/200x150?text=No+Image"}">
                <h3>${car.Year} ${car.Make} ${car.Model}</h3>
                <p class="price">${car.Price}</p>
                <p>${car.Mileage} mi</p>
                <div class="seller-info">
                    <p><b>${car.Seller}</b></p>
                    <p>${formatAddress(car.SellerAddress || car.Location)}</p>
                    <p>${car.SellerPhone || ""}</p>
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
                        <div class="price">${c.Price}</div>
                        <div class="meta">${c.Mileage} mi • ${c.Location}</div>
                    </div>
                </div>
                <div class="card-details">
                    <div class="detail-row"><span class="detail-label">Trim</span><span class="detail-value">${c.Trim}</span></div>
                    <div class="detail-row"><span class="detail-label">Seller</span><span class="detail-value">${c.Seller}</span></div>
                    <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${formatAddress(c.SellerAddress)}</span></div>
                    <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${c.SellerPhone || "N/A"}</span></div>
                    <div class="detail-row"><span class="detail-label">Distance</span><span class="detail-value">${c.Distance} mi</span></div>
                    <div class="detail-row"><span class="detail-label">Market Days</span><span class="detail-value">${c.DaysOnMarket}</span></div>
                    <div class="detail-row"><span class="detail-label">Deal Rating</span><span class="detail-value">${(c.DealRating || "NA").replace("_", " ")}</span></div>
                    
                    <div class="action-buttons">
                        <a href="${c.MapsUrl}" class="btn-nav" target="_blank">📍 Open Navigation</a>
                        <a href="${c.Link}" class="btn-view" target="_blank">🔗 View on CarGurus</a>
                    </div>
                </div>
            `;
            
            card.querySelector(".visibility-toggle").onclick = (e) => {
                e.stopPropagation();
                obj.visible = e.target.checked;
                renderList();
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

init();