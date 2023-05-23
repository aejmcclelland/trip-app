const mongoose = require('mongoose');
const Attractions = require('/Users/andrewmcclelland/Documents/Dissertation/TripApp/models/attractionsModel');
const City = require('/Users/andrewmcclelland/Documents/Dissertation/TripApp/models/citiesModel');

mongoose
  .connect(
    'mongodb+srv://Andrew:1ul6aO9Ji6YBp0JH@cluster0.nrspjic.mongodb.net/attractions',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

const updateCities = async () => {
  try {
    const attractions = await Attractions.find();
    const bulkUpdateOps = [];

    for (let i = 0; i < attractions.length; i++) {
      bulkUpdateOps.push({
        updateOne: {
          filter: { _id: attractions[i].city_id },
          update: { $push: { attraction_ids: attractions[i]._id } },
        },
      });
    }

    const result = await City.bulkWrite(bulkUpdateOps);
    console.log(`${result.modifiedCount} cities updated`);
  } catch (err) {
    console.log(err);
  } finally {
    mongoose.connection.close();
    console.log('Connection to MongoDB closed');
  }
};

mongoose.set('strictQuery', false);

updateCities();
