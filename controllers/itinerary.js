const Itinerary = require('../models/itineraryModel');
const London = require('../models/attractionsModel');
const dayjs = require('dayjs');
const asyncHandler = require('../asyncHandle/async');
const mongoose = require('mongoose'); //include mongoose

//@Desc POST an attraction to the itinerary
//@POST attraction
exports.postItinerary = asyncHandler(async (req, res) => {
  console.log('Body:', req.body);
  const { attractionId } = req.body;
  // Convert the attractionId to an ObjectId
  const attractionObjectId = mongoose.Types.ObjectId(attractionId);
  // Create a new Itinerary document with the attractionObjectId
  const itinerary = new Itinerary({
    attraction_ids: attractionObjectId,
    user_id: req.user._id,
  });
  // Save the itinerary to the database
  await itinerary.save();
  req.flash('success', 'Successfully added a new attraction to your itinerary');
  // Retrieve the updated itinerary with populated attraction details
  const updatedItinerary = await Itinerary.findById(itinerary._id).populate(
    'attraction_ids'
  );

  // Render the itinerary view with the updated data
  res.render('itinerary/itinerary', {
    attractions: [updatedItinerary],
    hasMap: false,
    dayjs,
  });
});

//@desc Handle new itinerary create GET
exports.getItinerary = asyncHandler(async (req, res) => {
  const hasMap = false;
  //user authentication
  const user = req.user;
  // Find user's itinerary and populate the attraction details
  const itinerary = await Itinerary.find({ user_id: user._id })
    .populate('attraction_ids')
    .sort({ createdAt: -1 });

  console.log('Attractions:', itinerary); // Log the attractions array on the server-side
  res.render('itinerary/itinerary', {
    attractions: itinerary,
    hasMap,
    dayjs,
  });
});

//@Desc delete attraction form itinerary
//@Desc DELETE attraction
exports.deleteAttraction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Find the itinerary by ID and remove it
  const deletedItinerary = await Itinerary.findByIdAndRemove(id);

  if (!deletedItinerary) {
    // Handle the case if the itinerary is not found
    return res.status(404).json({ error: 'Itinerary not found' });
  }
  req.flash('success', 'Successfully deleted an attraction from your itinerary');
  res.sendStatus(204);
  //res.redirect('/itinerary');
});
