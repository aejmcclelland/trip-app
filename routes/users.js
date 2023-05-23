const express = require('express');
const passport = require('passport');
const { checkReturnTo } = require('../loginMiddleware');
const {
  getUser,
  registerUser,
  getLogin,
  userLogin,
  logout,
} = require('../controllers/users');

//const usersRouter = require('./users');
const router = express.Router();
//router.route('/').get(home);
//GET single User
router.route('/register').get(getUser).post(registerUser);

//GET and POST Login
router
  .route('/login')
  .get(getLogin)
  .post(
    checkReturnTo,
    passport.authenticate('local', {
      failureFlash: true,
      successRedirect: '/attractions',
      failureReDirect: '/login',
    }),
    userLogin
  );

router.route('/logout').get(logout);

module.exports = router;
