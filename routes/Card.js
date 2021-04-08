/**
 * Require libraries
 * @type {createApplication}
 */
var express = require('express');
var router = express.Router();
var card = require('../controller/card');

/**
 * Define routes
 */
router.get('/list', card.getAllList);

/**
 * Export module
 * @type {Router}
 */
module.exports = router;