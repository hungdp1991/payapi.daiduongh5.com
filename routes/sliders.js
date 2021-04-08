/**
 * Require
 * @type {createApplication}
 */
let express = require('express');
let router = express.Router();
let slidersController = require('../controller/sliders');

/**
 * Define routes
 */
router.get('/get-default-slider', slidersController.getDefaultSlider);

/**
 * Export routes
 * @type {Router}
 */
module.exports = router;