const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citySchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    default: mongoose.Types.ObjectId,
  },
  imgUrl: {
    String,
  },
  city: {
    type: String,
    required: true,
  },
  geometry: {
    //GeoJSON
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  attraction_ids: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Attractions',
    },
  ],
});

const City = mongoose.model('City', citySchema, 'Cities');

module.exports = City;
