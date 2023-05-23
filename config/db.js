const mongoose = require('mongoose');
const asyncHandler = require('../asyncHandle/async');
mongoose.set('strictQuery', false); //remove strict schema option

const connectDB = asyncHandler(async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    console.log(mongoose.connection.readyState);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

module.exports = connectDB;
