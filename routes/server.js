var express = require('express');
var router = express.Router();
var server = require('../controller/server');

router.get('/list', server.getList);

module.exports = router;