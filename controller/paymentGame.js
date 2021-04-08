var BaseController = require('../controller/base');
var Config = require('../config');
var Validate = require('../utility');
var Payment = require('../model/payment');
var Passport = require('../model/passport');
var Passport = new Passport(Config.config.passport);
var Game = require('../model/game');
var _ = require('lodash');
var md5 = require('md5');
var moment = require('moment');
var Utility = require('../utility');

let PaymentGame = {};

/**
 * charge card to game
 * @param serial
 * @param code
 * @param username
 * @param productAgent
 * @param type
 * @param server_id
 * @param sign 
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
PaymentGame.chargeCard = async function(req, res){
    const params = req.query;
    try {
        const { serial, code, username, productAgent, type, server_id, sign, product_gold_id } = params;
        if(Validate.required(serial) || Validate.required(code) || Validate.required(username) || Validate.required(productAgent) ||
            Validate.required(type) || Validate.required(server_id) || Validate.required(sign) || Validate.required(product_gold_id)){
            const msg  = 'field serial, code, username, productAgent, type, serverId, product_gold_id, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(username + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        if(serial.length<6 || serial.length>15 || code.length<6 || code.length>15){
            const msg  = 'Số serie or pin không hợp lệ';
            return res.send(BaseController.generateResponse(0, msg));
        }
        let parameters = {
            in_type: type.trim(),
            in_serie: serial.trim(),
            in_pin: code.trim(),
            product_id: productAgent,
            in_username: username,
            server_id: server_id,
            product_gold_id: product_gold_id
        };

        const configPayment = Config.config.payment;
        const user = await Passport.getUser(username);

        parameters.in_email = user.result.email ? user.result.email : 'null';
        parameters.id_user = user.result.id;
        const chargeReuslt = await Payment.chargeCardReturnValue(parameters, configPayment);
        return res.send(BaseController.generateResponse(chargeReuslt.status, chargeReuslt.msg));
        return res.send(BaseController.generateResponse(1, "Nap vao game thanh cong"));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, e));
    }
}   

/**
 * charge atm to game
 * @param username
 * @param productAgent
 * @param amount
 * @param roleId
 * @param server_id
 * @param sign 
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
PaymentGame.chargeAtm = async function(req, res){
    const params = req.query;
    let data = {};
    try {
        const { username, productAgent, amount, roleId, sign, server_id } = params;
        if(Validate.required(amount) || Validate.required(username) || Validate.required(productAgent) || Validate.required(roleId) || Validate.required(sign) || Validate.required(server_id)){
            const msg  = 'field amount, username, productAgent, roleId, server_id, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(username + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        const configPassport = Config.config.passport;
        const configAtm = Config.config.atm;
        const user = await Passport.getUser(username, configPassport);
        let parameters = {
            product_id: productAgent,
            in_username: username,
            in_amount: parseInt(amount),
            in_type: 'ATM',
            in_gold: 0,
            in_serie: '',
            in_pin: '',
            role_id: roleId,
            balance: 0,
            in_email: user.result.email ? user.result.email : 'null',
            id_user: user.result.id,
            server_id: server_id
        };
        var d = new Date();
        const transId = parameters.product_id + d.getTime() + Utility.random(7);
        await Payment.addHistoryTran(transId, parameters.server_id);
        const result = await Payment.chargeAtm(parameters, configAtm);
        data.link = result;
        return res.send(BaseController.generateResponse(1, 'success', data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}

/**
 * success charge atm to wallet
 * @param trans_id
 * @param amount
 * @param status
 * @param cardType
 * @param message
 * @param sign
 * @param gold
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
PaymentGame.successChargeAtm = async function(req, res){
    try {
        const params = req.query;
        const { trans_id, amount, status, message, sign, gold } = params;
        if(Validate.required(trans_id) || Validate.required(amount) || Validate.required(status) || Validate.required(message) || Validate.required(sign) || Validate.required(gold)){
            const msg  = 'field trans_id, amount, status, message, sign, gold is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const logCardCharge = _.head(await Payment.getLogCardCharge(trans_id));
        const games = await Game.getAll();
        let product_id = null
        games.map((game) => {
            if(trans_id.includes(game.agent)){
                product_id = game.agent;
            }
        })
        const configAtm = Config.config.atm;
        if(sign != md5(trans_id + amount + configAtm[product_id].secret)){
            return res.send(BaseController.generateResponse(0, "Thông tin xác thực không chính xác"));
        }
        let parameters = {
            in_type: 'ATM',
            status: status,
            amount: amount,
            trans_id: trans_id,
            in_transaction: trans_id,
            sign: sign,
            gold: gold,
            return_cardType: 'null',
            cardMessage: message,
            in_username: logCardCharge.username,
            product_id: product_id,
            email: 'null'
        };

        const configPayment = Config.config.payment;
        const rates = configPayment[parameters.product_id].rate;
        rates.forEach((rate) => {
            if(rate.type == parameters.in_type){
                parameters.gold = parseInt(parameters.gold) * rate.rate;
            }
        });
        
        const history_trans = _head(await Payment.getHistoryTrans(trans_id));
        parameters.server_id = history_trans.server_id;
        parameters.gold_id = 1;
        ///paytogame
        const resultPayGame = await Game.payToGame(parameters, configGame);
        parameters.cardMessage = resultPayGame.status == 1 ? 'Nạp tiền vào game thành công' : 'Nạp vào game thất bại';
        parameters.card_status = resultPayGame.status == 1 ? 1 : -1;


        const result = _.head(await Payment.updateLogCharge(parameters));
        if(result.status != 1) {
            return res.send(BaseController.generateResponse(0, "Cập nhập thông tin thất bại"));
        }
        const configPassport = Config.config.passport;
        const user = await Passport.getUser(parameters.in_username, configPassport);
        parameters.id_user = user.result.id;
        const string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "ChargeATM'
            +'","agent": "'+parameters.product_id
            +'","username": "'+parameters.in_username
            +'","userId": "'+parameters.id_user
            +'","transactionId": "'+parameters.trans_id
            +'","status": "'+parameters.status
            +'","amount": "'+parameters.amount
            +'","trans_id": "'+parameters.trans_id
            +'","sign": "'+parameters.sign
            +'","gold": "'+parameters.gold
            +'","cardType": "'+parameters.return_cardType
            +'","message": "'+parameters.cardMessage+'" }';
        Payment.saveLogFileFn(parameters.product_id, string, parameters.in_type);
        return res.send(BaseController.generateResponse(resultPayGame.status == 1 ? 1 : 0, parameters.cardMessage));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}

/**
 * error charge atm to wallet
 * @param status
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
PaymentGame.errorChargeAtm = function(req, res){
    try {
        const params = req.query;
        const { status } = params;
        let message = 'Nạp tiền không thành công';
        switch (parseInt(status)) {
            case 0:
                message = 'Thông tin đại lý không đúng';
                break;
            case -6:
                message = 'Kênh tạm đóng hoặc không hỗ trợ';
                break;
            case -7:
                message = 'Mã giao dịch bị trùng';
                break;
        }
        return res.send(BaseController.generateResponse(0, message));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'internal server'));
    }
}

module.exports = PaymentGame;