var express = require('express');
var router = express.Router();
var paymentIap = require('../controller/paymentIap');

router.get('/exchange', paymentIap.exchange);

module.exports = router;