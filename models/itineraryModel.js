const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itinerarySchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    default: () => mongoose.Types.ObjectId(),
  },
  attraction_ids: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Attractions',
      required: [true, 'Itinerary must belong to an attraction!'],
    },
  ],
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Itinerary must belong to a User!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  // total: {
  //   type: Number,
  //   required: true,
  //   min: [1, 'Quantity can not be less than 1.'],
  // },
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

module.exports = Itinerary;
