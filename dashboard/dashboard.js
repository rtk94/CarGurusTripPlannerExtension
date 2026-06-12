const CITY_COORDS = {
    'Jackson, NJ': [40.0984, -74.3485], 'Franklinville, NJ': [39.6165, -75.0760], 'Bordentown, NJ': [40.1446, -74.7065],
    'Riverside, NJ': [40.0384, -74.9577], 'Quakertown, PA': [40.4409, -75.3413], 'Norristown, PA': [40.1215, -75.3399],
    'Pottstown, PA': [40.2454, -75.6496], 'Bridgeton, NJ': [39.4273, -75.2341], 'Sicklerville, NJ': [39.7212, -75.0007],
    'Wilmington, DE': [39.7447, -75.5484], 'Lindenwold, NJ': [39.8243, -74.9913], 'Pennsauken, NJ': [39.9537, -75.0538],
    'Maple Shade, NJ': [39.9454, -74.9963], 'Burlington, NJ': [40.0712, -74.8649], 'Woodbury, NJ': [39.8382, -75.1527],
    'Voorhees, NJ': [39.8512, -74.9654], 'Mount Laurel, NJ': [39.9340, -74.8910], 'Jenkintown, PA': [40.0957, -75.1235],
    'Bethlehem, PA': [40.6259, -75.3705], 'Philadelphia, PA': [39.9526, -75.1652], 'Lambertville, NJ': [40.3659, -74.9429],
    'Cherry Hill, NJ': [39.9348, -75.0307], 'Marlton, NJ': [39.8912, -74.9182], 'Blackwood, NJ': [39.8001, -75.0607],
    'Vineland, NJ': [39.4862, -75.0257], 'Conshohocken, PA': [40.0793, -75.3016], 'Sharon Hill, PA': [39.9048, -75.2671]
};

let map, markerObjects = [];

async function init() {
    map = L.map('map').setView([40.0, -75.0], 9);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 20
    }).addTo(map);

    const result = await chrome.storage.local.get(['cars']);
    const cars = Object.values(result.cars || {});

    cars.forEach((car, index) => {
        const coords = CITY_COORDS[car.Location] || [39.95, -75.16];
        const jittered = [coords[0] + (Math.random()-0.5)*0.015, coords[1] + (Math.random()-0.5)*0.015];
        
        const popupContent = `
            <div class='car-popup'>
                <img src='${car.ImageURL || "https://via.placeholder.com/200x150?text=No+Image"}'>
                <h3>${car.Year} ${car.Make} ${car.Model}</h3>
                <p><b>Price:</b> ${car.Price} | <b>Miles:</b> ${car.Mileage}</p>
                <a href='${car.Link}' target='_blank'>View Listing</a>
            </div>`;
        
        const marker = L.marker(jittered).addTo(map).bindPopup(popupContent);
        markerObjects.push({ marker, car, visible: true });
    });

    renderList();
    document.getElementById('search-input').addEventListener('input', renderList);
    document.getElementById('autocenter-toggle').addEventListener('change', renderList);
    document.getElementById('export-csv').addEventListener('click', exportCSV);
}

function renderList() {
    const list = document.getElementById('car-list');
    list.innerHTML = '';
    const query = document.getElementById('search-input').value.toLowerCase();
    const visibleMarkers = [];

    markerObjects.forEach((obj, index) => {
        const c = obj.car;
        const match = c.Make.toLowerCase().includes(query) || c.Model.toLowerCase().includes(query) || 
                    c.Year.toString().includes(query) || c.Location.toLowerCase().includes(query);
        
        if (match) {
            const card = document.createElement('div');
            card.className = 'car-card' + (obj.visible ? '' : ' hidden');
            card.innerHTML = `<input type='checkbox' class='visibility-toggle' ${obj.visible ? 'checked' : ''}>
                             <h4>${c.Year} ${c.Make} ${c.Model}</h4>
                             <div class='details'>${c.Price} | ${c.Mileage} mi</div>`;
            
            card.querySelector('input').onclick = (e) => {
                e.stopPropagation();
                obj.visible = e.target.checked;
                renderList();
            };
            card.onclick = () => {
                map.setView(obj.marker.getLatLng(), 14);
                obj.marker.openPopup();
            };
            list.appendChild(card);
            if (obj.visible) { obj.marker.addTo(map); visibleMarkers.push(obj.marker); }
            else { map.removeLayer(obj.marker); }
        } else { map.removeLayer(obj.marker); }
    });

    if (document.getElementById('autocenter-toggle').checked && visibleMarkers.length > 0) {
        const group = new L.featureGroup(visibleMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function exportCSV() {
    const cars = markerObjects.map(o => o.car);
    if (cars.length === 0) return;
    const headers = Object.keys(cars[0]).join(',');
    const rows = cars.map(c => Object.values(c).map(v => '"' + v + '"').join(',')).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cars_for_nikki.csv';
    a.click();
}

init();
