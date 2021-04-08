/**
 * Require
 * @type {createApplication}
 */
let express = require('express');
let router = express.Router();
let postsController = require('../controller/post');

/**
 * Define routes
 */
router.get('/get-list', postsController.getList);
router.get('/get-detail/:slug', postsController.getDetail);

/**
 * Export routes
 * @type {Router}
 */
module.exports = router;