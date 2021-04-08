var express = require('express');
var router = express.Router();
var history = require('../controller/history');

router.get('/card', history.card);
router.get('/paytogame', history.payToGame);

module.exports = router;