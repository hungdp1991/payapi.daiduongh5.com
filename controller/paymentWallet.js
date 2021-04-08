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
var Gold = require('../model/gold');
var Utility = require('../utility');

let paymentWallet = {};
/**
 * charge card to wallet
 * @param serial
 * @param code
 * @param username
 * @param productAgent
 * @param type
 * @param sign 
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
paymentWallet.chargeCard = async function(req, res){
    const params = req.query;
    let data = {};
    try {
        const { serial, code, username, productAgent, type, sign } = params;
        if(Validate.required(serial) || Validate.required(code) || Validate.required(username) || Validate.required(productAgent) || Validate.required(type) || Validate.required(sign)){
            const msg  = 'field serial, code, username, productAgent, type, sign is required';
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
            in_username: username
        };

        const user = await Passport.getUser(username);
        parameters.in_email = user.result.email ? user.result.email : 'null';
        parameters.id_user = user.result.id;

        const result = await Payment.chargeCardWallet(parameters);
        const status = result.status == 1 ? 1 : 0;

        data.balance = result.balance;

        if (status != 1) {
            //Get Balance (temporary comment)
            const configPayment = Config.config.payment;
            const balance = await Payment.getBalance(username, productAgent, configPayment);
            data.balance = balance.balance;
        }

        return res.send(BaseController.generateResponse(status, result.msg, data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}   

/**
 * charge atm to wallet
 * @param username
 * @param productAgent
 * @param amount
 * @param sign 
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
paymentWallet.chargeAtm = async function(req, res){
    const params = req.query;
    let data = {};
    try {
        const { username, productAgent, amount, sign } = params;
        if(Validate.required(amount) || Validate.required(username) || Validate.required(productAgent) || Validate.required(sign)){
            const msg  = 'field amount, username, productAgent, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(username + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        const configPassport = Config.config.passport;
        const configAtm = Config.config.atm;
        const configPayment = Config.config.payment;
        const user = await Passport.getUser(username, configPassport);

        const balance = await Payment.getBalance(username, productAgent, configPayment);
        let parameters = {
            product_id: productAgent,
            in_username: username,
            in_amount: parseInt(amount),
            in_type: 'ATM',
            in_gold: '0',
            in_serie: '',
            in_pin: '',
            in_email: user.result.email ? user.result.email : 'null',
            id_user: user.result.id,
            balance: balance.balance,
        };
        const result = await Payment.chargeAtm(parameters, configAtm);
        data.link = result;

        console.error('chargeATM: ');
        console.error(result);

        return res.send(BaseController.generateResponse(1, 'success', data));
    } catch (e) {
        console.log(e.message);
        console.log(e.stack);
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
paymentWallet.successChargeAtm = async function(req, res){
    try {
        const params = req.query;
        const { trans_id, amount, status, message, sign, gold } = params;

        console.error('successAtm return params:');
        console.error(params);

        if(Validate.required(trans_id) || Validate.required(amount) || Validate.required(status) || Validate.required(message) || Validate.required(sign) || Validate.required(gold)){
            return res.send(BaseController.generateResponse(0, 'field trans_id, amount, status, message, sign, gold is required'));
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
            card_status: status
        };
        const result = _.head(await Payment.updateLogCharge(parameters));
        if((_.head(result).result) != 1) {
            return res.redirect(configAtm[product_id].returnUrl + "?status=0&messages=Cập nhập thông tin thất bại");
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

        if (status != 1) {
            return res.redirect(configAtm[product_id].returnUrl + "?status=0&messages=Nạp tiền thất bại");
        }

        return res.redirect(configAtm[product_id].returnUrl + "?status=1&messages=Nạp tiền thành công");
    } catch (e) {
        return res.redirect(configAtm[product_id].returnUrl + "?status=0&messages=intenal server");
    }
}

/**
 * error charge atm to wallet
 * @param status
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
paymentWallet.errorChargeAtm = function(req, res){
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
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}

/**
 * PAY TO GAME
 * @param roleId
 * @param goldId
 * @param username
 * @param productAgent
 * @param serverId
 * @param sign 
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
paymentWallet.payToGame = async function(req, res) {
    const params = req.query;
    let data = {};
    try{
        var d = new Date();
        const { roleId, goldId, username, productAgent, serverId, sign, roleName } = params;
        if(Validate.required(roleId)){
            return res.send(BaseController.generateResponse(0, 'Lỗi, không tìm thấy nhân vật'));
        }
        if(Validate.required(roleId) || Validate.required(goldId) || Validate.required(username) || Validate.required(productAgent) || Validate.required(serverId) || Validate.required(sign) || Validate.required(roleName)){
            const msg  = 'field roleId, goldId, username, productAgent, serverId, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(roleId + roleName + username + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        const gold = _.head(await Gold.getGoldById(goldId));
        if(!gold){
            return res.send(BaseController.generateResponse(0, 'Lỗi, không tồn tại gói nạp'));
        }
        const configPayment = Config.config.payment;
        const balance = await Payment.getBalance(username, productAgent, configPayment);
        const configPassport = Config.config.passport;
        const user = await Passport.getUser(username, configPassport);
        console.error(user);
        console.error(balance);
        let parameters = {
            id_user: user.result.id,
            in_email: user.result.email ? user.result.email : 'null',
            in_gold: (gold.gold) || '0',
            card_month: gold.card_month,
            in_amount: gold.amount,
            product_gold_id: gold.product_gold_id,
            balance: balance.balance,
            in_type: 'GOLD',
            product_id: productAgent,
            in_username: username,
            role_id: roleId,
            server_id: serverId,
            role_name: roleName
        }
        if(gold.amount > parameters.balance){
            return res.send(BaseController.generateResponse(0, 'Lỗi, không tồn tại gói nạp'));
        }
        if(parameters.in_amount <= 0){
            return res.send(BaseController.generateResponse(0, 'Lỗi, Giá trị amount không hợp lệ'));
        } 
        parameters.transId = (parameters.in_type + parameters.product_id + d.getTime() + Utility.random(7)).toLowerCase();
        const updateBalance = await Payment.updateBalance(parameters, configPayment); ///update balance wallet
        console.error("updateBalance: ");
        console.error(updateBalance);

        if(updateBalance.status == 1) {
            data.balance = updateBalance.balance;
            const configGame = Config.config.game;
            const resultPayGame = await Game.payToGame(parameters, configGame[parameters.product_id]);
            const msg = resultPayGame.status == 1 ? 'Nạp tiền vào game thành công' : 'Lỗi nạp thẻ vào game, hãy liên hệ với bộ phận CSKH để được hỗ trợ';
            const status = resultPayGame.status == 1 ? 1 : 0;
            return res.send(BaseController.generateResponse(status, msg, data));
        }else{
            return res.send(BaseController.generateResponse(0, 'Lỗi trừ tiền trong ví, hãy liên hệ với bộ phận CSKH để được hỗ trợ'));
        }
    } catch (e) {
        console.error("Exception: ");
        console.error(e);
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}

module.exports = paymentWallet;