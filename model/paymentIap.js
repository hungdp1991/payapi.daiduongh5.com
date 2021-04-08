var BaseModel = require('../model/BaseModel');
var moment = require('moment');


class PaymentIap extends BaseModel {
    async saveLogIapCharge(parameters) {
        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const params = [
            parameters.transaction_id, parameters.uid, parameters.server_id, parameters.product_id, parameters.order_vnd,
            parameters.order_amount, parameters.time, parameters.payload, parameters.agent, parameters.os,
            parameters.username, parameters.status, currentTime, currentTime
        ];

        const value = "(" + "?,".repeat(params.length - 1) + "?)";

        let sql = "INSERT INTO log_iap_charge (`transaction_id`, `uid`, `server_id`, `product_id`, `order_vnd`, `order_amount`, `time`, `payload`, `agent`, `os`, `username`, `status`, `created_at`, `updated_at`) VALUES ";
        sql += value;
        return this.doQuery(sql, params);
    }

    updateLogIapChargeStatus(parameters) {
        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = "UPDATE log_iap_charge SET `status` = ?, `updated_at` = ? WHERE `id` =  ?";
        return this.doQuery(sql, [parameters.status, currentTime, parameters.id]);
    }

}


module.exports = PaymentIap;