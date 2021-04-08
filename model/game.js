var md5 = require('md5');
const axios = require('axios');
var modelCore = require('../model/modelCore');
var moment = require('moment');

var Game = {
    payToGame: async function (parameters, config) {
        try {
            var d = new Date();
            const time = Math.round(d.getTime() / 1000);

            const sign = md5(parameters.id_user + parameters.role_id + parameters.server_id + parameters.transId + parameters.product_gold_id + parameters.in_amount + parameters.in_gold + time + config.keyPay);
            const link = config.domainCharge + '?userid=' + parameters.id_user + '&roleid=' + parameters.role_id + '&server_id=' + parameters.server_id
                + '&order_id=' + parameters.transId + '&item_id=' + parameters.product_gold_id + '&money=' + parameters.in_amount + '&gold=' + parameters.in_gold + '&time=' + time + '&sign=' + sign;

            const response = await axios.get(link);
            const result = response.data;

            console.error(link);
            console.error(result);
            parameters.cardMessage = result.status == 1 ? 'Nạp vào game thành công' : 'Nạp vào game thất bại';
            parameters.card_status = parseInt(result.status ? result.status : 0);
            /////   
            const string = '{ "date": "' + moment().format('HH:mm:ss YYYY-MM-DD') + '", "service": "ChargeCard'
                + '","agent": "' + parameters.product_id
                + '","productAgent": "' + parameters.product_id
                + '","username": "' + parameters.in_username
                + '","userId": "' + parameters.id_user
                +'","server_id": "'+parameters.server_id
                +'","roleid": "'+parameters.role_id
                + '","email": "' + parameters.email
                + '","amount": "' + parameters.in_amount
                + '","transactionId": "' + parameters.transId
                + '","cardStatus": "' + parameters.card_status
                + '","cardMessage": "' + parameters.cardMessage
                + '","link": "' + link
                + '" }';
            modelCore.saveLogFile(parameters.product_id, string, 'exchange');
            this.saveLogPay(parameters);
            return result;
        } catch (err) {
            parameters.card_status = 0;
            this.saveLogPay(parameters);
            console.error(err);
        }
    },

    getRole: async function (userId, serverId, config) {
        var d = new Date();
        const time = Math.round(d.getTime() / 1000); //d.getTime();
        const sign = md5(userId + serverId + time + config.keyRole);

        const link = config.domainRole + '?userid=' + userId + '&server_id=' + serverId + '&time=' + time + '&sign=' + sign;
        console.log('link ' + link);
        const response = await axios.get(link);
        return response.data;
    },

    getAll: function (ip = null) {
        let sql = "SELECT * FROM product ORDER BY \`order\` ASC";
        if (ip != null) {
            sql = "SELECT * FROM product WHERE limit_local = '[]' OR limit_local LIKE ? ORDER BY `order` ASC";
        }

        return modelCore.doQuery(sql, ['%' + ip + '%']);
    },

    getGameBySlug: function (slug) {
        const sql = "Select * from product where slug = ? and status = 1";
        return modelCore.doQuery(sql, [slug])
    },

    saveLogPay(parameters) {
        // const sql = "CALL sp_card_create_paygame ('"
        //     + parameters.transId + "'," + parameters.in_gold + ",'" + parameters.in_username + "','" + parameters.role_name + "','" + parameters.server_id + "','" + parameters.product_id + "'," + parameters.card_status + ")";
        //
        // return modelCore.doQuery(sql)
        let params = [
            parameters.transId, parameters.in_gold, parameters.in_username, parameters.role_name, parameters.server_id,
            parameters.product_gold_id, parameters.card_status
        ];
        const value = "(" + "?,".repeat(params.length - 1) + "?)";
        const sql = "CALL sp_card_create_paygame " + value;

        return modelCore.doQuery(sql, params)
    }
};


module.exports = Game;
