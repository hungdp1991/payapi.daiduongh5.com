var express = require('express');
var router = express.Router();
var game = require('../controller/game');

router.get('/get-list', game.getList);
router.get('/detail', game.detail);
router.get('/get-role', game.getRole);
router.get('/refund', game.refund);

module.exports = router;