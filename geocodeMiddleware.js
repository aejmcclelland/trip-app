const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

module.exports = {
  getAttractionsLoc: async (req, res, next, cityName) => {
    console.log('middleware');
    // Reset cityCoords array at the start of each request
    cityCoords = [];
    console.log('Form for city:', cityName);
    try {
      // Check if cityCoords has been set
      console.log('geoCode:', geocoder);
      // Make GET request to route of main template
      const geoData = await geocoder
        .forwardGeocode({
          query: cityName.toString(),
          limit: 1,
        })
        .send();
      console.log('Geocoder response:', geoData.body.features);
      if (geoData.body.features.length === 0) {
        return res.status(404).send({ message: 'City not found' });
      }
      const cityCoords = geoData.body.features[0].bbox;
      // Pass cityCoords as response
      req.cityCoords = cityCoords;
      console.log('City coords:', cityCoords);
    } catch (error) {
      // Set error message on the request object
      req.cityCoordsError = 'City not found';
      next(error);
    }
  },
};
