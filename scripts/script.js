// API endpoint and your API key
const apiEndpoint = 'https://api.sinay.ai/container-tracking/api/v2/shipment';
const apiKey = '840c0617-c745-4feb-9bc3-8ac5aee14d18';

// Function to detect the shipping line from the container number
function detectShippingLine(containerNumber) {
    const prefixes = {
        'HLCU': /^(HLCU|HDMU|HLXU|HLJU|HLBU|HLLU|HLMU|HLNU|HLPU|HLRU|HLSU|HLTU|HLVU|HLWU|HLXU|HLYU|HLZU)/,
        'MAEU': /^(MAEU|MSKU|MATU|MSCU|MSDU|MSEU|MSGU|MSHU|MSJU|MSKU|MSLU|MSMU|MSNU|MSOU|MSPU|MSQU|MSRU|MSSU|MSTU|MSVU|MSWU|MSXU|MSYU|MSZU)/,
        'MSCU': /^(MSCU|MSDU|MSEU|MSGU|MSHU|MSJU|MSKU|MSLU|MSMU|MSNU|MSOU|MSPU|MSQU|MSRU|MSSU|MSTU|MSVU|MSWU|MSXU|MSYU|MSZU)/,
        'MEDU':/^(MEDU|MSEU|MSLU|MSMU|MSNU|MSOU|MSPU|MSQU|MSRU|MSSU|MSTU|MSVU|MSWU|MSXU|MSYU|MSZU)/,
        'MSEU': /^(MSEU|MSLU|MSMU|MSNU|MSOU|MSPU|MSQU|MSRU|MSSU|MSTU|MSVU|MSWU|MSXU|MSYU|MSZU)/,
        'MSLU': /^(MSLU|MSMU|MSNU|MSOU|MSPU|MSQU|MSRU|MSSU|MSTU|MSVU|MSWU|MSXU|MSYU|MSZU)/,
        'MSMU': /^(MSMU|MSNU|MSOU|MSPU|MSQU|MSRU|MSSU|MSTU|MSVU|MSWU|MSXU|MSYU|MSZU)/,
        'TCNU': /^(TCNU|TCRU|TCWU|TCXU|TCYU|TCZU)/,
    };

    for (const sealine in prefixes) {
        if (prefixes[sealine].test(containerNumber)) {
            return sealine;
        }
    }

    return null;
}

// Function to make the API request
async function fetchContainerData(shipmentNumber, sealine, shipmentType) {
    const url = `${apiEndpoint}?shipmentNumber=${shipmentNumber}&sealine=${sealine}&shipmentType=${shipmentType}&route=true&ais=true`;
    const response = await fetch(url, {
        headers: {
            'accept': 'application/json',
            'API_KEY': apiKey
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// Function to render the container details
function renderContainerDetails(data) {
    const metadataDiv = document.getElementById('metadata');
    const locationsDiv = document.getElementById('locations');
    const eventsDiv = document.getElementById('events');

    // Clear previous content
    metadataDiv.innerHTML = '';
    locationsDiv.innerHTML = '';
    eventsDiv.innerHTML = '';

    // Check if metadata exists
    if (data.metadata) {
        const metadata = data.metadata;
        const destination = data.locations.find(location => location.type === 'DESTINATION');

        metadataDiv.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Metadata</h3>
                </div>
                <div class="card-body">
                    <p class="card-text"><strong>Shipment Number:</strong> ${metadata.shipmentNumber}</p>
                    <p class="card-text"><strong>Sealine:</strong> ${metadata.sealine}</p>
                    <p class="card-text"><strong>Shipping Status:</strong> ${metadata.shippingStatus}</p>
                    ${destination ? `<p class="card-text"><strong>Destination:</strong> ${destination.name}, ${destination.country}</p>` : ''}
                </div>
            </div>
        `;
    } else {
        metadataDiv.innerHTML = '<div class="card"><div class="card-body"><h3 class="card-title">Metadata</h3><p class="card-text">No metadata available</p></div></div>';
    }

    // Render locations
    const locations = data.locations;
    locationsDiv.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Locations</h3>
            </div>
            <div class="card-body">
                <ul class="list-group">
                    ${locations.map(location => `<li class="list-group-item">${location.name}, ${location.country}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    // Render events
    const events = data.containers && data.containers.length > 0 ? data.containers[0].events : [];
    eventsDiv.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Events</h3>
            </div>
            <div class="card-body">
                <ul class="list-group">
                    ${events.map(event => `<li class="list-group-item">${event.description} - ${event.date}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Function to initialize the map
function initMap() {
    const mapElement = document.getElementById('map');
    const initialLatLng = [31.7917, -7.0926]; // Initial coordinates [latitude, longitude]

    const map = L.map(mapElement, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 5,
        maxZoom: 5,
        maxBounds: [[-90, -180], [90, 180]]
    }).setView(initialLatLng, 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 18
    }).addTo(map);

    return map;
}

// Function to update the map with the container's location
function updateMapLocation(map, data) {
    const coordinates = data.routeData?.coordinates;
    if (coordinates) {
        const marker = L.marker([coordinates.lat, coordinates.lng], {
            icon: L.icon({
                iconUrl: 'images/container-ship.png',
                iconSize: [62, 62]
            })
        }).addTo(map);

        // Center the map on the current location and zoom in
        map.setView([coordinates.lat, coordinates.lng], 6);
    } else {
        console.warn('No coordinates available for the current location');
    }
}

// Initialize the map
const map = initMap();

// Event listener for the "Track" button
const trackButton = document.getElementById('trackButton');
trackButton.addEventListener('click', () => {
    const containerNumber = document.getElementById('containerNumber').value;
    const sealine = detectShippingLine(containerNumber);
    const shipmentType = 'CT'; // Replace with the appropriate shipment type value

    if (containerNumber && sealine) {
        fetchContainerData(containerNumber, sealine, shipmentType)
            .then(data => {
                renderContainerDetails(data);
                updateMapLocation(map, data);
            })
            .catch(error => {
                console.error('Error fetching container data:', error);
                alert('An error occurred while fetching container data. Please try again later.');
            });
    } else {
        alert('Please enter a valid container number.');
    }
});