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
    const containerDetailsDiv = document.getElementById('containerDetails');
    containerDetailsDiv.innerHTML = '';

    if (data.metadata) {
        const metadata = data.metadata;
        const destination = data.locations.find(location => location.type === 'DESTINATION');

        const metadataHTML = `
            <div class="expand-and-remove">
              <button id="expandButton" class="btn btn-primary">Expand</button>
              <button id="removeButton" class="btn btn-danger">Remove</button>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Metadata</h3>
                </div>
                <div class="card-body">
                    <p class="card-text"><strong>Container Number:</strong> ${metadata.shipmentNumber}</p>
                    <p class="card-text"><strong>Sealine:</strong> ${metadata.sealine}</p>
                    <p class="card-text"><strong>Shipping Status:</strong> ${metadata.shippingStatus}</p>
                    ${destination ? `<p class="card-text"><strong>Destination:</strong> ${destination.name}, ${destination.country}</p>` : ''}
                </div>
            </div>
            <div id="extraDetails" style="display: none;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Locations</h3>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${data.locations.map(location => `<p class="card-text">${location.name}, ${location.country}</p>`).join('')}
                        </ul>
                    </div>
                </div>
                <br>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Events</h3>
                    </div>
                    <div class="card-body">
                        <ul class="list-group">
                            ${(data.containers && data.containers.length > 0 ? data.containers[0].events : []).map(event => `<p class="card-text">${event.description} - ${new Date(event.date).toISOString().split('T')[0]}</p>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        containerDetailsDiv.innerHTML = metadataHTML;

        const expandButton = document.getElementById('expandButton');
        const removeButton = document.getElementById('removeButton');
        const extraDetails = document.getElementById('extraDetails');
        let isExpanded = false;

        expandButton.addEventListener('click', () => {
            isExpanded = !isExpanded;
            if (isExpanded) {
                extraDetails.style.display = 'block';
                expandButton.textContent = 'Retract';
            } else {
                extraDetails.style.display = 'none';
                expandButton.textContent = 'Expand';
            }
        });

        removeButton.addEventListener('click', () => {
            containerDetailsDiv.innerHTML = '';
        });
    } else {
        containerDetailsDiv.innerHTML = '<div class="card"><div class="card-body"><h3 class="card-title">Metadata</h3><p class="card-text">No metadata available</p></div></div>';
    }
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
    const shipmentType = 'CT';

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
