const express = require('express');

const {
  getItinerary,
  postItinerary,
  deleteAttraction,
} = require('../controllers/itinerary');

const router = express.Router({ mergeParams: true });
//POST all itinersries
router.route('/add').post(postItinerary);
//GETitinerary
router.route('/').get(getItinerary);
//DELETE attraction from itinerary
router.route('/:id').delete(deleteAttraction);
module.exports = router;
