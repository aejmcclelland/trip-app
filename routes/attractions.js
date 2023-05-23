const express = require('express');

const {
  getAttraction_category,
  getAttractionLocations,
  newAttraction,
  getAllAttractions,
  getAttraction_detail,
  updateAttraction,
  deleteAttraction,
  userLocationAndJourneys,
  journeys,
  getJourneyDetails,
  createAttraction,
} = require('../controllers/attractions');

//include other resource routers
const itineraryRouter = require('./itineraries');
const router = express.Router();
//GET attraction details
router.route('/:city/:id').get(getAttraction_detail);
//POST attraction location data
router.route('/attractionlocation').post(getAttractionLocations);
//GET category of attractions
router.route('/category').get(getAttraction_category);
//GET new attraction
router.route('/new').get(newAttraction);
//PUT update all Attractions
router.route('/update').put(updateAttraction);
//POST userlocation
router.route('/userlocation').post(userLocationAndJourneys);
//GET TfL journey planner data
router.route('/journeys').get(journeys);
//GET the journey details
router.route('/journeydetails').get(getJourneyDetails);
//GET all categories //POST new atraction
router.route('/').get(getAllAttractions).post(createAttraction);
//DELETE attraction
router.route('/:id').delete(deleteAttraction);

module.exports = router;
