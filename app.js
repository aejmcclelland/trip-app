const express = require('express'); //include express.js
const path = require('path'); //provides working path for node
const bodyParser = require('body-parser');
const engine = require('ejs-mate'); // require ejs to render js on frontend
const morgan = require('morgan');
const flash = require('connect-flash');
const connectDB = require('./config/db'); // get db connection
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' }); //Load env vars
const User = require('./models/userModel');
const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const utc = require('dayjs/plugin/utc');
const customParseFormat = require('dayjs/plugin/customParseFormat');
let toObject = require('dayjs/plugin/toObject');
const itineraryRoutes = require('./routes/itineraries');
const attractionsRoutes = require('./routes/attractions');
const userRoutes = require('./routes/users');
const cors = require('cors');
const colors = require('colors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const geocodeMiddleware = require('./geocodeMiddleware');
// This help convert the id from string to ObjectId for the _id.
const ObjectId = require('mongodb').ObjectId;

//Connect to database
const dbUrl = process.env.MONGO_URI;

connectDB();

const app = express(); // create an intance of Express
app.engine('ejs', engine); //template engine to use .ejs fike extension
app.use(bodyParser.urlencoded({ extended: false })); //parse URL-encoded data in the request body
app.use(bodyParser.json()); // handle JSON data in request body
app.use(morgan('common')); //middleware for logging HTTP requests
dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(toObject);
app.set('view engine', 'ejs'); //Use EJS for template engine
app.set('views', path.join(__dirname, 'views')); //set directory for views
app.use(express.urlencoded({ extended: true })); //parse URL-encoded data in the request body
app.use(express.static(path.join(__dirname, 'public'))); //directory for static files
app.use(cors({ credentials: true })); //Cross Origins Resource Sharing for sessions
app.use(express.json()); //similar to bodyParser

const storeConfig = {
  mongoUrl: dbUrl, //connect to MongoDB for session storage
  touchAfter: 24 * 3600, // time period in seconds
};

const sessionConfig = {
  secret: 'thisshouldbeabettersecret!', //secret used to sign the session ID cookie
  resave: false, //optimise performance by only saving the session when changes have been made
  saveUninitialized: true, //determin if save session on every request
  store: MongoStore.create(storeConfig), //connect to MongoStore
  cookie: {
    //define cookie settings
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //session cookie expires in 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7, //maximum age of session cookie 7 days
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email', //add cutom field set to email only
    },
    User.authenticate() //authneticate function
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  // use  flash-connect messages across app
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// path for views
app.use('/', userRoutes);
app.use('/attractions', attractionsRoutes);
console.log('App.js file is being executed.');
app.use('/itinerary', itineraryRoutes);

//server connection connecting to PORT 3000

const PORT = process.env.PORT || 3000; //use port 3000 for local access
//starting server
const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
  )
);
//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message.red}`);
  //Close server & exit process
  server.close(() => process.exit(1));
});
