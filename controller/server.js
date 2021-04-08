var ServerModel = require('../model/server');
var BaseController = require('../controller/base');
var Validate = require('../utility');


exports.getList = async function (req, res) {
    try {
        ServerModel.getServerByGameID(req.query.productId)
            .then((response) => {
                res.send(BaseController.generateResponse(1, 'success', response));
            })
            .catch((err) => {
                res.send(BaseController.generateResponse(0, 'error'));
            })
    } catch (e) {
        res.send(BaseController.generateResponse(0, 'error', e));
    }
};

