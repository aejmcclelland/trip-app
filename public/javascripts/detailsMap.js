mapboxgl.accessToken = mapBoxToken;

const local = locations;
const morePoints = local.features.geometry.coordinates;
const placeLat = morePoints[1];
const placeLng = morePoints[0];
const { popUpDetailMap } = local.features.properties;
const getPlace_Id = local.features.id;
const attraction = morePoints;
console.log(attraction, getPlace_Id);

const map = new mapboxgl.Map({
  container: 'map',
  // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
  style: 'mapbox://styles/amcclelland/clbh3260h006614qm4tkm4sue',
  attributionControl: false,
  center: attraction,
  zoom: 12,
});

const nav = new mapboxgl.NavigationControl({
  showZoom: true,
  showCompass: false,
});
map.addControl(nav, 'bottom-right');

// Add geolocate control to the map.
const geolocate = new mapboxgl.GeolocateControl({
  positionOptions: {
    enableHighAccuracy: true,
  },
  // When active the map will receive updates to the device's location as it changes.
  trackUserLocation: true,
  // Draw an arrow next to the location dot to indicate which direction the device is heading.
  showUserHeading: true,
});
// Add the control to the map.
map.addControl(geolocate);

geolocate.on('geolocate', function (position) {
  // Get user current location
  const lat = position.coords.latitude;
  const long = position.coords.longitude;
  const geoData = {
    startPoint: [lat, long],
    endPoint: [placeLat, placeLng],
  };

  map.flyTo({
    center: [long, lat],
    zoom: 12, //set zoom
  });
  // send POST request to server with user location
  axios
    .post('/attractions', geoData)
    .then(function (response) {
      console.log('Location of user sent', geoData);
    })
    .catch(function (error) {
      console.log(error);
    });
});

// create the popup

const popup = new mapboxgl.Popup({
  offset: [0, 10],
});

popup
  .setLngLat(attraction)
  .setMaxWidth('200')
  .setHTML(popUpDetailMap)
  .setLngLat(attraction)
  .addTo(map);

// create DOM element for the marker
const el = document.createElement('div');
el.className = 'marker';

// create the marker
new mapboxgl.Marker(el)
  .setLngLat(attraction)
  .setPopup(popup)
  // sets a popup on this marker
  .addTo(map);
