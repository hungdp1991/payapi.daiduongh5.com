///lib
var _ = require('lodash');
///model
var Game = require('../model/game');
var BaseController = require('../controller/base');
var ServerModel = require('../model/server');
var Gold = require('../model/gold');
var Config = require('../config');
var Payment = require('../model/payment');
var Validate = require('../utility');
var md5 = require('md5');
var LogAgent = require('../model/logAgent');
var modelCore = require('../model/modelCore');
const axios = require('axios');
var NetaloLogin = require('../model/NetaloLogin');
var NetaloLogin = new NetaloLogin;

///// game list
exports.getList = function (req, res) {
    try {
        const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
        Game.getAll(ip)
            .then((response) => {
                res.send(BaseController.generateResponse(1, 'success', response));
            })
            .catch((err) => {
                res.send(BaseController.generateResponse(0, 'error'));
            })
    } catch (e) {
        res.send(BaseController.generateResponse(0, 'error'));
    }
};

/**
 * Game detail
 * @param username
 * @param slug
 * @param sign
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
 */
exports.detail = async function (req, res) {
    const params = req.query;
    let data = {};
    try {
        const { username, slug, sign } = params;
        if (Validate.required(username) || Validate.required(slug) || Validate.required(sign)) {
            const msg = 'field username, slug, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(username + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        const game = await Game.getGameBySlug(slug);
        data.game = game;
        if (game.length > 0) {
            const agent = _.head(game).agent;
            const configPayment = Config.config.payment;
            if(typeof(configPayment[agent]) == "undefined")
                return res.send(BaseController.generateResponse(2, 'agent khong ton tai'));
            const servers = await ServerModel.getServerByGameID(_.head(game).id);
            data.servers = servers;
            const golds = await Gold.getGoldByProductAgent(agent);
            data.golds = golds;
            const balance = await Payment.getBalance(username, agent, configPayment);
            data.balance = balance.balance;
        }
        return res.send(BaseController.generateResponse(1, 'success', data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
};

/**
 * Game get role
 * @param server_id
 * @param id_user
 * @param productAgent
 * @param sign
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
 */
exports.getRole = async function (req, res) {
    const params = req.query;
    let data = {};
    try {
        const {server_id, id_user, productAgent, sign} = params;
        if (Validate.required(server_id) || Validate.required(id_user) || Validate.required(productAgent) || Validate.required(sign)) {
            const msg = 'field server_id, slug, productAgent, sign is required';
            return res.send(BaseController.generateResponse(0, msg));
        }
        const signServer = md5(id_user + jwtToken);
        if(signServer != sign) {
            return res.send(BaseController.generateResponse(0, 'Chu ky khong hop le'));
        }
        const configGame = Config.config.game[productAgent];
        data.role = [];
        const result = await Game.getRole(id_user, server_id, configGame);

        if (result.status == 1) {
            result.data.forEach(function(rw, idx){
                data.role[idx] = {
                    "roleId": rw.ID,
                    "roleName": rw.RoleName,
                }
            });
        } else {
            //log error status
            console.error(result);
        }

        status = result.status == 1 ? 1 : 0;
        msg = result.status == 1 ? "success" : 'Không lấy được thông tin nhân vật';
        return res.send(BaseController.generateResponse(status, msg, data));
    } catch (e) {
        console.log(e.stack)
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
};

/**
 * Game refund
 * @param productAgent
 * @param username
 * @param userId
 * @param serverId
 * @param roleId
 * @param goldId
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
 */
exports.refund = async function(req, res) {
    // const params = req.query;
    var scripts = req.query.scripts;
    if (Validate.required(scripts)) {
        const msg = 'Parameters Không Hợp Lệ';
        return res.send(BaseController.generateResponse(0, msg));
    }

    scripts = NetaloLogin.decrypt(scripts);

    const params = JSON.parse(scripts);

    let data = {};
    try {
        const {productAgent, username, userId, serverId, roleId, roleName, goldId, time} = params;
        if (Validate.required(productAgent) || Validate.required(username) || Validate.required(userId) || Validate.required(serverId) || Validate.required(roleId) || Validate.required(goldId) || Validate.required(roleName) || Validate.required(time)) {
            const msg = 'field productAgent, username, userId, serverId, roleId, goldId, roleName, time is required';
            return res.send(BaseController.generateResponse(0, msg));
        }

        const gold = _.head(await Gold.getGoldById(goldId));
        if(!gold){
            return res.send(BaseController.generateResponse(0, 'Lỗi, không tồn tại gói nạp'));
        }
        let parameters = {
            in_email: 'null',
            in_transaction: 'REF' + time,
            balance: '0',
            in_type: 'REF',
            in_pin: 'null',
            in_serie: 'null',
            cardTransid: 'null',
            product_id: productAgent,
            in_username: username,
            id_user: userId,
            server_id: serverId,
            role_id: roleId,
            product_gold_id: gold.product_gold_id,
            in_amount: gold.amount,
            in_gold: (gold.gold) || '0',
            role_name: roleName
        }
      
        const configGame = Config.config.game[productAgent];
        var d = new Date();
        const sign = md5(parameters.id_user + parameters.role_id + parameters.server_id + parameters.in_transaction + parameters.product_gold_id + parameters.in_amount + parameters.in_gold + time + configGame.keyPay);
        const link = configGame.domainCharge + '?userid=' + parameters.id_user + '&roleid=' + parameters.role_id + '&server_id=' + parameters.server_id
            + '&order_id=' + parameters.in_transaction + '&item_id=' + parameters.product_gold_id + '&money=' + parameters.in_amount + '&gold=' + parameters.in_gold + '&time=' + time + '&sign=' + sign;
        const response = await axios.get(link);
        const result = response.data;
        parameters.cardMessage = result.status == 1 ? 'Đền bù thành công' : 'Đền bù thất bại';
        parameters.card_status = (result.status == 1 ? 1 : result.status);
        parameters.status = result.status == 1 ? 1 : -1;
        LogAgent.saveLog(result, parameters);
        saveLogCharge(parameters);
        if(result.status == 1) {
            saveLogRefund(parameters);
        }
        status = result.status == 1 ? 1 : 0;
        msg = result.status == 1 ? 'Đền bù thành công' : 'Đền bù thất bại';
        return res.send(BaseController.generateResponse(status, msg, data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }

    function saveLogCharge(parameters){
        const sql = "CALL sp_card_insert_transaction ('"
        +parameters.in_transaction+"','"+parameters.in_username+"','"+parameters.in_email+"','"+parameters.in_pin
        +"','"+parameters.in_serie+"','"+parameters.in_type+"',"+parameters.status+","+parameters.in_amount+","+parameters.in_gold
        +",'"+parameters.cardMessage+"',"+parameters.card_status+",'"+parameters.cardTransid+"',"+parameters.balance+",'"+parameters.product_id+"')";
        return modelCore.doQuery(sql);
    }

    function saveLogRefund(parameters){
        const sql = "CALL sp_card_create_paygame ('"
        +parameters.in_transaction+"',"+parameters.in_gold+",'"+parameters.in_username+"','"+parameters.role_name+"','"+parameters.server_id+"','"+parameters.product_id+"',"+parameters.card_status+")";
        return modelCore.doQuery(sql);
    }
}       
