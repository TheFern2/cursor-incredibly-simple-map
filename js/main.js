document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map centered on the US
    const map = L.map('map').setView([37.8, -96], 4);

    // Add the tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Style for states
    const stateStyle = {
        color: '#2196F3',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.35
    };

    // Highlight style for hover
    const highlightStyle = {
        color: '#1976D2',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.5
    };

    // Function to handle state hover
    function highlightFeature(e) {
        const layer = e.target;
        layer.setStyle(highlightStyle);
    }

    // Function to reset state style
    function resetHighlight(e) {
        const layer = e.target;
        layer.setStyle(stateStyle);
    }

    // Function to handle state click
    function onStateClick(e) {
        const layer = e.target;
        const stateName = layer.feature.properties.name;
        
        layer.bindPopup(stateName).openPopup();
    }

    // Function to add listeners to state layers
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: onStateClick
        });
    }

    // Fetch and add GeoJSON data for US states
    fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: stateStyle,
                onEachFeature: onEachFeature
            }).addTo(map);
        })
        .catch(error => {
            console.error('Error loading the states data:', error);
            map.setView([37.8, -96], 4);
        });

    // Restrict the map view to the continental US
    const southWest = L.latLng(24.396308, -125.000000);
    const northEast = L.latLng(49.384358, -66.934570);
    const bounds = L.latLngBounds(southWest, northEast);
    
    map.setMaxBounds(bounds);
    map.setMinZoom(3);
    map.setMaxZoom(8);
}); 