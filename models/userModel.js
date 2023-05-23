const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  itineraries: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Itinerary',
    },
  ],
  password: String,
});

//Set username field to be email only
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

//Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', UserSchema);
module.exports = User;
