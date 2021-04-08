var express = require('express');
var router = express.Router();
var paymentWallet = require('../controller/paymentWallet');

router.get('/charge-card', paymentWallet.chargeCard);
router.get('/charge-atm', paymentWallet.chargeAtm);
router.get('/success-charge-atm', paymentWallet.successChargeAtm);
router.get('/error-charge-atm', paymentWallet.errorChargeAtm);
router.get('/pay-to-game', paymentWallet.payToGame);

module.exports = router;