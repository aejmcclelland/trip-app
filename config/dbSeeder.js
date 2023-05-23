const csv = require('csv-parser');
const fs = require('fs');
const mongoose = require('mongoose');

const collectionName = 'Attnractions'; // collection to seeded
const filePath = '../csvConvert/Paris.csv'; //csv file path

// connect to your MongoDB database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
try {
  console.log('MongoDB connected successfully');
  // collection to seed
  const collection = mongoose.connection.collection(collectionName);
  // read the CSV file and insert all rows into the collection
  const documents = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      documents.push(data);
    })
    .on('end', () => {
      collection.insertMany(documents, (err, result) => {
        if (err) throw err;
        console.log(`Inserted ${result.insertedCount} row(s)`);
        // disconnect from the MongoDB database after processing the CSV file
        mongoose.disconnect();
      });
    });
} catch (err) {
  console.error(err);
  process.exit(1);
}
