/**
 * Require modules
 * @type {{getList: function(): *}}
 */
const CardModel = require('../model/card');
const BaseController = require('../controller/base');

/**
 * Define controller
 * @type {{getAllList: getAllList}}
 */
module.exports = {
    /**
     * Get cards list
     * @param req
     * @param res
     * @returns {Promise<void>}
     */
    getAllList: async (req, res) => {
        CardModel.getList()
            .then((response) => {
                res.send(BaseController.generateResponse(1, 'success', response));
            })
            .catch((error) => {
                res.send(BaseController.generateResponse(0, 'error'));
            })
    }
}

