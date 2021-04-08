var express = require('express');
var router = express.Router();
var PaymentGame = require('../controller/paymentGame');

router.get('/charge-card', PaymentGame.chargeCard);
router.get('/charge-atm', PaymentGame.chargeAtm);
router.get('/success-charge-atm', PaymentGame.successChargeAtm);
router.get('/error-charge-atm', PaymentGame.errorChargeAtm);

module.exports = router;