const asyncHandler = require('../asyncHandle/async');
const Attractions = require('../models/attractionsModel');
const City = require('../models/citiesModel');
const Itinerary = require('../models/itineraryModel');
const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { default: axios } = require('axios');
const geocodeMiddleware = require('../geocodeMiddleware');
const mongoose = require('mongoose'); //include mongoose
const ObjectId = mongoose.Types.ObjectId;
const currentTime = dayjs().format('HHmm');
const currentDate = dayjs().format('YYYYMMDD');

exports.userLocation = asyncHandler(async (req, res) => {
  req.session.startPoint = { startPoint: '' };

  req.session.endPoint = { endPoint: '' };

  req.session.date = { date: '' };

  req.session.time = { time: '' };

  const { longitude, latitude, end } = req.body;
  console.log('Re end:', end);

  if (
    !end ||
    !end.features ||
    end.features.length === 0 ||
    !longitude ||
    !latitude
  ) {
    res.status(400).json({ error: 'Invalid request parameters' });
    return;
  }
  const endPointTfL = {
    latitude: end.features[0].geometry.coordinates[1],
    longitude: end.features[0].geometry.coordinates[0],
  };

  console.log('end:', endPointTfL);
  //lat and long of geolocation
  // Use the Mapbox Geocoding API to retrieve the city name based on the user's coordinates
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
    {
      params: {
        access_token: mapBoxToken,
        types: 'place',
        language: 'en',
        limit: 1,
      },
    }
  );

  const features = response.data.features;
  console.log('Features:', features); //geocode details for reverse geocode city
  if (features.length > 0) {
    const city = features[0].text;
    const cityBbox = features[0].bbox;
    req.cityBbox = cityBbox; //bounding box for geolcated city
    req.city = city; // set the city name on the request object
    // Retrieve all attractions for the city and return them to the client
    // Send attractions to the client
    const startPoint = [latitude, longitude];
    const endPoint = `${endPointTfL.latitude},${endPointTfL.longitude}`;
    if (city === 'London') {
      req.session.startPoint = startPoint;
      req.session.endPoint = endPoint;
      req.session.date = currentDate;
      req.session.time = currentTime;
      console.log('Journey details stored in session:', startPoint, endPoint);
      //console.log('HTTP method:', req.method);
      console.log('City Name:', city);
      console.log(
        'Journey route input data:',
        startPoint,
        endPoint,
        currentDate,
        currentTime
      );
      res.send(cityBbox);
    } else {
      delete req.session.startPoint;
      delete req.session.endPoint;
      delete req.session.date;
      delete req.session.time; // clear the session
      res.status(400).json({ error: 'Invalid request method or city' });
    }
  } else {
    // clear the session
    res.status(400).json({ error: 'Unable to determine user location' });
  }
});

//GET request for tfl API
exports.journeys = asyncHandler(async (req, res, next) => {
  if (!req.session.journeyDetails) {
    //checks if journeydetail already exists in session
    req.session.journeyDetails = {
      //if not, initialise wwith empty values
      arrivalTime: '',
      totalCost: '',
      departPoint: '',
      arrivalPoint: '',
      departTime: '',
      journeyDuration: '',
    };
  }
  const journeyDetails = req.session.journeyDetails; //assign session to local var

  try {
    const startPoint = req.session.startPoint;
    const endPoint = req.session.endPoint;
    const date = req.session.date;
    const time = req.session.time;
    console.log('Time:', time);
    console.log('Sessions:', req.session);
    const response = await axios.get(
      `https://api.tfl.gov.uk/Journey/JourneyResults/${startPoint}/to/${endPoint}?date=${date}&time=${time}&timeIs=Departing&journeyPreference=LeastInterchange&mode=tube&accessibilityPreference=NoRequirements&walkingSpeed=Fast&cyclePreference=None&bikeProficiency=Easy&applyHtmlMarkup=true&routeBetweenEntrances=true`,
      {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('TfL Response:', response);
    const allJourneys = response.data.journeys.map((journeys) => {
      return {
        ...journeys,
        fare: journeys.fare ? journeys.fare.totalCost : null,
      };
    });
    if (!allJourneys) {
      console.error('No journeys found in response');
      res.status(500).json({ message: 'Error fetching journeys' });
      return;
    }
    console.log('journeys controller: journeyDetails', journeyDetails);
    const newJourney = allJourneys[0]; // extract the first journey
    console.log('This journey:', newJourney);
    // Update journeyDetails with new values
    journeyDetails.arrivalTime = newJourney.legs[0].arrivalTime;
    journeyDetails.totalCost = newJourney.fare / 100;
    journeyDetails.departPoint = newJourney.legs[0].departurePoint.commonName;
    journeyDetails.arrivalPoint =
      newJourney.legs[newJourney.legs.length - 1].arrivalPoint.commonName;
    journeyDetails.departTime = newJourney.legs[0].departureTime;
    journeyDetails.journeyDuration = newJourney.legs[0].duration;
    // Format the updated journeyDetails
    const formattedJourneyDetails = {
      arrivalTime: dayjs(journeyDetails.arrivalTime).format('DD-MM HH:mm'),
      totalCost: journeyDetails.totalCost,
      departPoint: journeyDetails.departPoint,
      arrivalPoint: journeyDetails.arrivalPoint,
      departTime: dayjs(journeyDetails.departTime).format('DD-MM HH:mm'),
      journeyDuration: journeyDetails.journeyDuration,
    };
    // Store the journeyDetails in the session
    req.session.journeyDetails = formattedJourneyDetails;
    await req.session.save(); // Save the session
    console.log('journeys controller:', journeyDetails);
  } catch (error) {
    console.error('Error while getting journey details:', error);
    res.status(500).json({ message: 'Error fetching journeys' });
  }
});

exports.userLocationAndJourneys = asyncHandler(async (req, res, next) => {
  try {
    await exports.userLocation(req, res);
    await exports.journeys(req, res);
    const journeyDetails = req.session.journeyDetails;
    console.log('journeys controller again:', journeyDetails);
    req.session.journeyDetails = journeyDetails; // Attach journeyDetails to the request object, just to be sure!!
    next();
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error fetching user location and journeys' });
  }
});
//@DESC Get api data
//@ Desc route handler for journeys session data as a JSON repsonse
exports.getJourneyDetails = asyncHandler(async (req, res) => {
  req.journeyDetails = journeyDetails;
  console.log('get Journey details:', journeyDetails);
  res.json(journeyDetails);
});
/// @desc    Get all attractions
// @desc GET /attractions/indexs
// @access  Public
exports.getAllAttractions = asyncHandler(async (req, res, next) => {
  const hasMap = true;
  const cities = await City.find({});
  const cityName = req.query.city || req.city; // use the city from the request if available
  const bbox = req.cityBbox;
  journeyDetails = req.session.journeyDetails;
  try {
    // Retrieve the journeyDetails parameter passed from the journeys controller
    let showCity;
    const currentTime = dayjs().format('HH:mm');
    if (cityName) {
      const cityAttractions = await City.findOne({ city: cityName })
        .populate('attraction_ids')
        .exec();
      showCity = cityAttractions.attraction_ids.map((attraction) => {
        const formattedOpenTime = dayjs(attraction.opening_time, 'HHmm').format(
          'HH:mm'
        );
        const formattedCloseTime = dayjs(
          attraction.closing_time,
          'HHmm'
        ).format('HH:mm');
        const isOpen =
          currentTime >= formattedOpenTime && currentTime <= formattedCloseTime;
        console.log('Open time:', isOpen);
        return {
          ...attraction.toObject(),
          formattedOpenTime,
          formattedCloseTime,
          isOpen,
        };
      });
      console.log('ShowCity:', showCity);
    } else {
      // Show all attractions
      if (!bbox) {
        // No bbox defined, show all attractions
        showCity = await Attractions.find({})
          .sort({ visit_duration: 1 })
          .limit(40);
      } else {
        // Show all attractions within the bounding box
        showCity = await Attractions.find({
          location: {
            $geoWithin: {
              $box: bbox,
            },
          },
        })
          .sort({ visit_duration: 1 })
          .limit(40);
      }
    }
    res.render('attractions', {
      mapBoxToken: mapBoxToken,
      attractions: showCity,
      showCity: showCity,
      cities,
      dayjs: dayjs,
      city: cityName,
      journeyDetails: journeyDetails,
      currentTime: currentTime,
      hasMap: hasMap,
    });
  } catch (err) {
    console.log(err); // log the error message
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc  Get attraction categorys
// @access  Public
// GET route handler for getting attractions by category and city
exports.getAttraction_category = asyncHandler(async (req, res, next) => {
  const cityName = req.query.city;
  const category = req.query.category;
  const hasMap = false;
  try {
    const city = await City.findOne({ city: cityName }).populate(
      'attraction_ids'
    );
    const currentTime = dayjs().format('HH:mm');
    const attractions = city.attraction_ids
      .filter((attraction) => attraction.category === category)
      .map((attraction) => {
        const formattedOpenTime = dayjs(attraction.opening_time, 'HHmm').format(
          'HH:mm'
        );
        const formattedCloseTime = dayjs(
          attraction.closing_time,
          'HHmm'
        ).format('HH:mm');
        const isOpen =
          currentTime >= formattedOpenTime && currentTime <= formattedCloseTime;
          console.log('Open time:', isOpen);
        return {
          ...attraction.toObject(),
          formattedOpenTime,
          formattedCloseTime,
          isOpen,
        };
      });

    const categories = city.attraction_ids.filter(
      (attraction) => attraction.category === category
    );

    res.render('attractions/category', {
      attractions,
      categories,
      dayjs: dayjs,
      city,
      currentTime: currentTime,
      hasMap: hasMap,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

exports.newAttraction = asyncHandler(async (req, res, next) => {
  const hasMap = false;
  const attractions = await Attractions.find({});
  res.render('attractions/new', {
    attractions,
    dayjs: dayjs,
    hasMap: hasMap,
  });
  console.error(err);
  if (err.code === 11000) {
    return res.status(400).json({ error: 'This attraction already exists' });
  }
});
// @desc    Create new attraction
// @desc    POST /attractions/index
// @access  Private
exports.createAttraction = asyncHandler(async (req, res, next) => {
  const hasMap = false;
  const attractions = req.body.attractions;
  if (!attractions || !attractions.address) {
    return res
      .status(400)
      .json({ message: 'Please provide an address for the attraction' });
  }

  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.attractions.address,
      limit: 1,
    })
    .send();
  if (geoData) {
    console.log('This:', geoData);
  } else {
    console.log('No geoData available.');
  }
  console.log('This:', geoData);
  const city = await Cities.findOne({ city: req.body.attractions.city });
  if (!city) {
    return res.status(404).json({ message: 'City not found' });
  }
  const attraction = new Attractions({
    place: req.body.place,
    address: req.body.address,
    city: city._id,
    geometry: geoData.body.features[0].geometry,
  });
  await attraction.save();
  res.status(201).json({
    success: true,
    data: attraction,
    hasMap: hasMap,
  });
});

// @desc    Get single attraction
// @desc    GET /attractions/palceDetails
// @access  Private
exports.getAttraction_detail = asyncHandler(async (req, res, next) => {
  const hasMap = true;
  const { city, id } = req.params;
  try {
    // Find the city
    const cityDetail = await City.findById(city).exec();
    if (!cityDetail) {
      return res.status(404).json({ error: 'No city found' });
    }
    const cityName = cityDetail.city;
    // Find the attraction within the city
    const query = Attractions.findById(id);
    // Execute the query to get the attraction document
    const attraction = await query.exec(); // Use 'await' here to retrieve the result
    // Calculate open/closed status
    const formattedOpenTime = dayjs(attraction.opening_time, 'HHmm').format(
      'HH:mm'
    );
    const formattedCloseTime = dayjs(attraction.closing_time, 'HHmm').format(
      'HH:mm'
    );
    const currentTime = dayjs().format('HH:mm');
    const isOpen =
      currentTime >= formattedOpenTime && currentTime <= formattedCloseTime;

    res.render('attractions/placeDetails', {
      city: cityDetail,
      locations: attraction,
      mapBoxToken: mapBoxToken,
      dayjs: dayjs,
      isOpen: isOpen,
      hasMap: hasMap,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update single attraction
// @desc    PUT /attractions/index/:id
// @access  Private
exports.updateAttraction = asyncHandler(async (req, res, next) => {
  const city = req.city;
  const cityDocument = await City.findOne({ city });
  const attractionIds = cityDocument.attraction_ids;
  const attractions = await Attractions.find({ _id: { $in: attractionIds } });

  res.render('attractions', {
    mapBoxToken: mapBoxToken,
    attractions: attractions,
    cities: cities,
    showCity: attractions,
    dayjs: dayjs,
    city: city,
  });
});

// @desc    Delete single attraction
// @desc    DELETE /attractions/index/:id
// @access  Private
exports.deleteAttraction = (req, res, next) => {
  res
    .status(200)
    .json({ success: true, msg: `Delete attraction ${req.params.id}` });
};

// @desc Post city Bbox coordinates from forwardGeocode middleware
// @desc POST /attractions/attractionlocation
exports.getAttractionLocations = asyncHandler(async (req, res, next) => {
  try {
    const { cityName } = req.body; // get city name from query parameter
    // Middleware function to get city coordinates
    await geocodeMiddleware.getAttractionsLoc(req, res, next, cityName);
    const { cityCoords } = req; //req cityCoords from middleware
    console.log('coords:', cityCoords);
    res.status(200).json({ cityCoords: cityCoords });
    // next();
    //move to next middleware/controller
  } catch (error) {
    console.log(error); //log if there is an error
    res.status(500).send({ message: 'Server Error' });
  }
});
