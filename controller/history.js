var BaseController = require('../controller/base');
var Config = require('../config');
var History = require('../model/history');
var Validate = require('../utility');
var _ = require('lodash');
var md5 = require('md5');

let history = {};
/**
 * get history charge card
 * @param fromDate
 * @param toDate
 * @param username
 * @param productAgent
 * @param sign
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
history.card = async function(req, res){
    const params = req.query;
    let data = {};
    try {
        const { fromDate, toDate, username, productAgent, sign } = params;
        if(Validate.required(username) || Validate.required(sign)){
            const msg = 'field username, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(username + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        let parameters = {
            in_transaction: 'null',
            in_status: 'null',
            in_type: 'null',
            in_serial: 'null',
            in_code: 'null',
            in_product_id: productAgent ? "'"+productAgent+"'" : 'null',
            fromDate: "'"+fromDate+"'",
            toDate: "'"+toDate+"'",
            in_username: "'"+username+"'",
        };
        const result = await History.getCardCharge(parameters);
        data = _.head(result);
        return res.send(BaseController.generateResponse(1, 'success', data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}


/**
 * get history pay to game
 * @param fromDate
 * @param toDate
 * @param username
 * @param productAgent
 * @param sign
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
history.payToGame = async function(req, res){
    const params = req.query;
    let data = {};
    try {
        const { fromDate, toDate, username, productAgent, sign } = params;
        if(Validate.required(username) || Validate.required(sign)){
            const msg = 'field username, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(username + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        let parameters = {
            in_role: 'null',
            in_transaction: 'null',
            in_status: 'null',
            in_type: 'null',
            in_serial: 'null',
            in_code: 'null',
            in_server: 'null',
            in_product_id: productAgent ? "'"+productAgent+"'" : 'null',
            fromDate: "'"+fromDate+"'",
            toDate: "'"+toDate+"'",
            in_username: "'"+username+"'",
        };
        const result = await History.getPayToGame(parameters);
        data = _.head(result);
        return res.send(BaseController.generateResponse(1, 'success', data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}

module.exports = history;