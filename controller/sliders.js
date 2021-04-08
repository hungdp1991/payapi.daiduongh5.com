/**
 * Get modules
 */
let baseController = require('../controller/base');
let slidersModel = require('../model/sliders');

/**
 * Define sliders controller
 */
let slidersController = {
        /**
         * Get activated slider
         * @param req
         * @param res
         * @created 2020-03-09 LongTHK
         */
        getDefaultSlider: function (req, res) {
            try {
                slidersModel.getDefaultSlider()
                    .then((response) => {
                        res.send(baseController.generateResponse(1, 'success', response));
                    })
                    .catch((err) => {
                        res.send(baseController.generateResponse(0, 'error'));
                    })
            } catch (e) {
                console.log(e);
            }
        },
    }
;


/**
 * Export sliders controller
 * @type {{}}
 */
module.exports = slidersController;