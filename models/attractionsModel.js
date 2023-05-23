const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');
const Schema = mongoose.Schema;
const opts = { toJSON: { virtuals: true } };
const dayjs = require('dayjs');
const attractionSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      default: () => mongoose.Types.ObjectId(),
    },
    place: {
      type: String,
      required: true,
    },
    city_id: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: String,
    address: String,
    post_code: String,
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
      formattedAddress: String,
      street: String,
      city: String,
      post_code: String,
      country: String,
    },
    opening_time: {
      type: String,
      type: String,
      get: function (time) {
        return formatTime(time);
      },
    },
    closing_time: {
      type: String,
      get: function (time) {
        return formatTime(time);
      },
    },
    last_entry: {
      type: String,
      type: String,
      get: function (time) {
        return formatTime(time);
      },
    },
    adult_ticket: {
      type: Number,
      get: (v) => Number((v / 100).toFixed(2)), // Convert to number and apply toFixed()
      set: (v) => Math.round(v * 100), // Multiply by 100 and round the result
    },
    child_ticket: {
      type: Number,
      get: (v) => Number((v / 100).toFixed(2)),
      set: (v) => Math.round(v * 100),
    },
    visit_duration: Number,
    cafe: { type: String },
    // date: {
    //   type: Date,
    //   default: new Date(),
    // },
    imgUrl: String,
    restaurant: String,
    itinerary: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Itinerary',
        required: [true, 'Itinerary must belong to an attraction!'],
      },
    ],
  },
  opts
);

attractionSchema.virtual('properties.popUpMarkup').get(function () {
  return `
  <img class="map-img" img src="${this.imgUrl}"/>
  <h5>${this.place}</h5>
  <p>${this.category}</p>
  <h3><a href="/attractions/${this.city_id}/${this._id}">More Details</a></h3>
  `;
});

attractionSchema.virtual('properties.popUpDetailMap').get(function () {
  return `
  <img class="map-img" img src="${this.imgUrl}"/>
  <h5>${this.place}</h5>
  <p>${this.category}</p>
  <h3><a href="${this._id}">Add to Itinerary</a></h3>
  `;
});

attractionSchema.virtual('formattedOpenTime').get(function () {
  return formatTime(this.opening_time);
});

attractionSchema.virtual('formattedCloseTime').get(function () {
  return formatTime(this.closing_time);
});

//format time
function formatTime(time) {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return `${padZero(hours)}:${padZero(minutes)}`;
}

function padZero(num) {
  return num.toString().padStart(2, '0');
}
// Geocode & create location address fields
attractionSchema.pre('save', async function (next) {
  const locate = await geocoder.geocode(this.address);
  this.geometry = {
    type: 'Point',
    coordinates: [locate[0].longitude, locate[0].latitude],
    formattedAddress: locate[0].formattedAddress,
    street: locate[0].street,
    city: locate[0].city,
    post_code: locate[0].zipcode,
  };

  //Do not save address in DB
  // this.address = undefined;
  // next();
});

attractionSchema.virtual('url').get(function () {
  return `/attractions${this._id}`;
});

const Attractions = mongoose.model(
  'Attractions',
  attractionSchema,
  'Attractions'
);

module.exports = Attractions;
