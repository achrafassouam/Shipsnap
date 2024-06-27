// map.js
var map = L.map('map',{
    zoomControl: false,
    minZoom: 2,
    attributionControl: false
}).setView([0, 0], 2); // Initial map view centered at the equator with zoom level 2

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 3 // Set the maximum zoom level here
}).addTo(map);

// Example of adding a marker for a cargo container
var containerMarker = L.marker([latitude, longitude]).addTo(map)
    .bindPopup('Cargo Container ID: 12345')
    .openPopup();

// Function to update marker position
function updateContainerPosition(lat, lon) {
    containerMarker.setLatLng([lat, lon]);
    containerMarker.getPopup().setContent('Updated Container Position');
}

// Simulate position update (replace with real-time data fetching in a real implementation)
setTimeout(function() {
    updateContainerPosition(newLatitude, newLongitude);
}, 5000);
