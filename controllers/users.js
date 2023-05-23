const User = require('../models/userModel');
const { Attraction, City } = require('../models/attractionsModel');
const days = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const asyncHandler = require('../asyncHandle/async');
const passport = require('passport');
//const ipinfo = require('ipinfo-express');
//@desc Get homepage
//@desc GET /attractions
//@access Public
exports.home = asyncHandler(async (req, res) => {
  const hasMap = false;
  res.render('attractions', { hasMap });
});
// @desc    Get user
// @desc GET /register
// @access  Public
exports.getUser = asyncHandler(async (req, res) => {
  const hasMap = false;
  res.render('users/register', { hasMap, dayjs: days });
});

// @desc    POST user
// @desc POST /register
// @access  Private
exports.registerUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new User({
      email,
      password,
    });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash('success', 'You have successfully registered!');
      res.redirect('attractions');
    });
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('register');
  }
});
// @desc    GET login
// @desc GET / login
// @access  Private
exports.getLogin = async (req, res) => {
  const hasMap = false;
  if (req.query.returnTo) {
    req.session.returnTo = req.query.returnTo;
  }
  res.render('users/login', { hasMap, dayjs: days });
};

// @desc    POST login
// @desc POST / login
// @access  Private
exports.userLogin = async (req, res) => {
  const { email } = req.body;
  req.flash('welcomeback', `welcome back! ${email}`);
  const redirectUrl = res.locals.returnTo || '/attractions';
  //delete req.session.returnTo;
  res.redirect(redirectUrl, {
    messages: req.flash('welcomeback', `welcome back! ${email}`),
  });
};

//@desc Get logout
// @desc GET / logout
// @access Private
exports.logout = async (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash('success', 'Bye for now!');
    // Clear location permission from session
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/attractions');
    });
  });
};
