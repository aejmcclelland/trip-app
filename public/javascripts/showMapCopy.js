mapboxgl.accessToken = mapBoxToken;
const resetMapBtn = document.getElementById('reset-map-btn');

const map = new mapboxgl.Map({
  container: 'map',
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  //style: 'mapbox://styles/amcclelland/clfxxp2rm000o01mmnq42xdyn',
  style: 'mapbox://styles/amcclelland/clbh3260h006614qm4tkm4sue',
  attributionControl: false,
  center: [-0.12464739999999997, 51.517321899999994],
  zoom: 10,
});

resetMapBtn.addEventListener('click', () => {
  map.flyTo({
    center: [2.050577, 51.163583],
    zoom: 4,
    essential: true, // if `false`, then it will not reset the map rotation
  });
});

// Define separate variables for current and new city bbox coordinates
let currentCityCoords = [];

// Define the updateMapAndAttractions function
function updateMap(cityCoords) {
  console.log('updateMap called with cityCoords:');
  //Remove existing marker layer and source if they exist
  if (map.getLayer('marker')) {
    map.removeLayer('marker');
  }
  if (map.getSource('marker')) {
    map.removeSource('marker');
  }

  // Reset currentCityCoords variable
  currentCityCoords = [];

  // Set the zoom level based on the city's bbox size
  const bbox = cityCoords.slice(0, 4);
  const bboxWidth = bbox[2] - bbox[0];
  const bboxHeight = bbox[3] - bbox[1];
  const maxBboxSize = Math.max(bboxWidth, bboxHeight);
  const zoomLevel = Math.floor(Math.log2(360 / maxBboxSize)) + 1.5;

  //define bbox coords from server
  let switchBbox = [cityCoords[0], cityCoords[1], cityCoords[2], cityCoords[3]];
  console.log('coords:', switchBbox);
  // create new bounds object
  let bounds = new mapboxgl.LngLatBounds([
    [switchBbox[0], switchBbox[1]],
    [switchBbox[2], switchBbox[3]],
  ]);
  console.log('Bounds:', bounds);
  //set map bounds
  map.fitBounds(bounds, { padding: 20, maxZoom: 10 });
  const center = bounds.getCenter();

  //Set the map center and zoom level
  map.flyTo({
    center: center.toArray(),
    zoom: zoomLevel,
    essential: true,
  });

  //console.log(map.flyto);

  map.addLayer({
    id: 'marker',
    type: 'circle',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: center.toArray(),
            },
          },
        ],
      },
    },
    paint: {
      'circle-radius': 10,
      'circle-color': '#F84C4C',
    },
  });
  console.log('updateMap called with cityCoords:', cityCoords);
  currentCityCoords = cityCoords;
}

// Reset map view and marker to initial state
function resetMap() {
  map.flyTo({
    center: map.getCenter(),
    zoom: 10,
  });
  // Clear currentCityCoords variable
  currentCityCoords = [];
}

// Add event listener to the form submit button
let form = document.getElementById('form-id');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('Form submitted!');
  try {
    getAttractionLocation(); // wait for the Promise to resolve
  } catch (error) {
    console.log(error);
  }
});
function getAttractionLocation() {
  console.log('getAttractionLocation');
  return new Promise((resolve, reject) => {
    const cityName = document.getElementById('cit').value;
    console.log('City:', cityName);
    axios({
      method: 'post',
      url: '/attractions/attractionlocation',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        cityName: cityName,
      },
    })
      .then((response) => {
        // Add this line to see the value of response.data
        if (response.data.cityCoords && response.data.cityCoords.length > 0) {
          console.log('City coordinates exist');
          updateMap(response.data.cityCoords);
          // Clear form input
          document.getElementById('cit').value = '';
        } else {
          resetMap();
          // Clear currentCityCoords variable
          currentCityCoords = [];
        }
      })
      .catch((error) => {
        console.log(error);
        console.log(error.config);
        resetMap();
      })
      .finally(() => {
        //Clear newCityCoords variable to allow for submitting new cities
        newCityCoords = [];
      });
  });
}

const nav = new mapboxgl.NavigationControl({
  showZoom: true,
  showCompass: true,
});
map.addControl(nav, 'bottom-right');

//***FROM MAPBOX ***///
map.on('load', () => {
  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.
  map.addSource('attraction', {
    type: 'geojson',
    data: attraction,
    cluster: true,
    clusterMaxZoom: 11, // Max zoom to cluster points on
    clusterRadius: 30, // Radius of each cluster when clustering points (defaults to 50)
  });

  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'attraction',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#EF5350',
        5,
        '#EF5350',
        10,
        '#EF5350',
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        12, //radius 12px
        4, //number of attractions in vicinity
        25, //radius 25
        8, //number of attractions
        35,
      ], //radius 35 px for more than 8
    },
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'attraction',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
  });

  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'attraction',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#C62828',
      'circle-radius': 6,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#EF5350',
    },
  });

  // inspect a cluster on click
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource('attraction')
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });
  // Create a popup
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    //offset: [0, 10],
    anchor: 'bottom-left',
  });

  // When a click event occurs on a feature in
  // the unclustered-point layer, open a popup at
  // the location of the feature, with
  // description HTML from its properties.
  map.on('mouseenter', 'unclustered-point', (e) => {
    const { popUpMarkup } = e.features[0].properties;
    const coordinates = e.features[0].geometry.coordinates.slice();

    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    //populate popup with coordinates and popUpMarkup virtualschema
    popup
      .setLngLat(coordinates)
      .setHTML(popUpMarkup)
      .setMaxWidth('200')
      .addTo(map);
    popup.setLngLat(coordinates);
  });

  map.on('mouseleave', 'unclustered-point', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });

  // Add geolocate control to the map.
  // Create a new HTML button element for geolocation
  const geolocationBtn = document.createElement('button');
  const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true,
    },
    // When active the map will receive updates to the device's location as it changes.
    trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true,
    zoom: 12,
  });
  map.getCanvasContainer().appendChild(geolocationBtn);

  //@DESC getDestination
  //@DESC get the destination point, when the user clicks on the map
  //decalre end outside function to make it available to other functions
  let end = null;

  function getDestination() {
    map.on('click', 'unclustered-point', (e) => {
      // Retrieve the coordinates of the selected destination
      const destination = e.features[0].geometry.coordinates.slice();

      // Remove the previous end layer
      if (map.getLayer('end')) {
        map.removeLayer('end');
        map.removeSource('end');
      }
      // Create a GeoJSON feature object for the destination
      end = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: destination,
            },
          },
        ],
      };

      // Check if the end layer already exists on the map
      if (map.getLayer('end')) {
        // If the layer exists, update its data source with the new GeoJSON feature
        map.getSource('end').setData(end);
      } else {
        // If the layer does not exist, add a new circle layer with the GeoJSON feature
        map.addLayer({
          id: 'end',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Point',
                    coordinates: destination,
                  },
                },
              ],
            },
          },
          paint: {
            'circle-radius': 7,
            'circle-color': '#f30',
          },
        });
      }
      //Call the getGeolocation function to retrieve the user's current location
      if (end !== null) {
        getGeolocation();
      }
    });
  }
  // Add the control to the map.
  map.addControl(geolocate);
  function getGeolocation() {
    geolocate.on('geolocate', function (e) {
      const longitude = e.coords.longitude;
      const latitude = e.coords.latitude;
      if (end !== null) {
        // Call the sendData function with the latitude, longitude, and end variables
        sendData(longitude, latitude, end);
      }
    });
  }

  //sendData
  //send destination and geolocation coordinates to GET route /journeys
  async function sendData(longitude, latitude, end) {
    try {
      const response = await axios.post('/attractions/userlocation', {
        longitude,
        latitude,
        end,
      });
      console.log('Response from server:', response.data);

      // Update the map's view based on the user's location
      map.flyTo({
        center: [longitude, latitude],
        zoom: 12,
        essential: true,
      });
    } catch (error) {
      console.log(error);
    }
  }

  //getJourneyDetails
  //request TfL journey data from server using HTTP GET request
  async function getJourneyDetails() {
    const journeyDetailsElement = document.getElementById('journey-details');

    try {
      const response = await axios.get('/attractions/journeydetails');
      const journeyDetails = response.data;

      journeyDetailsElement.innerHTML = `
        <p>Arrival time: ${journeyDetails.arrivalTime}</p>
        <p>Total cost: ${journeyDetails.totalCost}</p>
        <p>Departure point: ${journeyDetails.departPoint}</p>
        <p>Arrival point: ${journeyDetails.arrivalPoint}</p>
        <p>Departure time: ${journeyDetails.departTime}</p>
        <p>Journey duration: ${journeyDetails.journeyDuration}</p>
      `;

      journeyDetailsElement.style.display = 'block';

      // Update the variable in the script block with the new value
      window.journeyDetails = journeyDetails;
    } catch (error) {
      console.error('Error while getting journey details:', error);
    }

    console.log('getJourneyDetails function called');
    console.log('journey details:', journeyDetailsElement);
  }

  const getDirectionsBtn = document.getElementById('get-directions-btn');
  getDirectionsBtn.addEventListener('click', () => {
    console.log('button clicked');
    getJourneyDetails();
  });

  // Call the getDestination function to set up the event listener for selecting a destination
  getDestination();
});

// axios
//   .get(
//     `https://api.tfl.gov.uk/Journey/JourneyResults/${startInfo}/to/${coordsInfo}?date=${currentDate}&time=${currentTime}&timeIs=Departing&journeyPreference=leastinterchange&mode=tube&accessibilityPreference=NoRequirements&walkingSpeed=fast&cyclePreference=None&bikeProficiency=Easy&routeBetweenEntrances=true&applyHtmlMarkup=true`,
//     {
//       params: {
//         time: { currentTime },
//         date: { currentDate },
//         from: { startInfo },
//         to: { coordsInfo },
//       },
//     }
//   )
//   .then(function (response) {
//     // const route = response.data.journeys[0].legs[0].path.lineString;
//     // for (let routeLines of route) {
//     //   //console.log(routeLines);
//     // }
//     console.log(
//       'Departing at:',
//       response.data.journeys[0].legs[0].arrivalPoint.commonName
//     );
//     let deptPoint = response.data.journeys[0].legs[0].arrivalPoint.commonName;
//     if (deptPoint.charAt(0) === '1') deptPoint = deptPoint.slice(1); //remove number from tfl API
//     document.getElementById('departureStation').innerHTML = deptPoint;

//     const arrivPoint =
//       response.data.journeys[0].legs[1].arrivalPoint.commonName;
//     //if (arrivPoint.charAt(0) === '1') arrivPoint = arrivPoint.slice(1); //remove number from tfl API
//     document.getElementById('arrivalStation').innerHTML = arrivPoint;

//     const journTime = response.data.journeys[0].duration;
//     //.reduce((a, b) => a + b, 0);
//     document.getElementById('journeyTime').innerHTML = journTime;

//     const depTime = dayjs(
//       response.data.journeys[0].legs[(0, 1, 2)].departureTime
//     ).format('HH:mm');
//     document.getElementById('departTime').innerHTML = depTime;

//     //console.log('Next Train leaves: ', depTime);
//     //format number to convert number to currency
//     const formatter = new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'GBP',
//     });
//     const fare = formatter.format(
//       response.data.journeys[0].fare.fares[0].cost / 100
//     );
//     document.getElementById('cost').innerHTML = fare;

//     // console.log('£', response.data.journeys[0].fare.fares[0].cost);
//     // console.log(response.data.journeys[0]);
//   })
//   .catch(function (error) {
//     console.log(error);
//   })
//   .then(function () {
//     // always executed
//   });

// // Add the control to the map.
// const geoCoder = new MapboxGeocoder({
//   accessToken: mapboxgl.accessToken,
//   mapboxgl: mapboxgl,
//   placeholder: 'Search for places', // Placeholder text for the search bar
//   // Limit seach results to UK.
//   countries: 'GB',
//   // Use a bounding box to further limit results
//   bbox: [-0.608073, 51.306167, 0.207662, 51.649997],
// });

// document.getElementById('geocodes').appendChild(geoCoder.onAdd(map));

// // Get the geocoder results container.
// const results = document.getElementById('result');

// geoCoder.on('result', (e) => {
//   console.log(e.result);
//   const getHomeCoords = e.result.geometry.coordinates.slice();
//   // Clear results container when search is cleared.
//   geoCoder.on('clear', () => {
//     results.innerText = '';
//   });
//   //reverse and map a new coords array for tfl API
//   function nextAttraction() {
//     const returnToCoords = getHomeCoords
//       .slice(0)
//       .reverse()
//       .map((a) => a);
//     console.log('User is returning to destination:', returnToCoords);
//     return returnToCoords;
//   }
// });
