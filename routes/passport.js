var express = require('express');
var router = express.Router();
var passport = require('../controller/passport');
router.get('/login', passport.login);
router.get('/loginFB', passport.loginFB);
router.get('/loginGoogle', passport.loginGoogle);
router.get('/loginApple', passport.loginApple);
router.get('/loginNA', passport.loginNA);
router.get('/getuser', passport.getUser);

module.exports = router;