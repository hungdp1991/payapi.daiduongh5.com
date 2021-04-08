var md5 = require('md5');
var modelCore = require('../model/modelCore');
var moment = require('moment');
var Utility = require('../utility');

var LogAgent = {}

LogAgent.saveLog = function(result, parameters) {
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    var d = new Date();
    const transId = (d.getTime() + Utility.random(10)).toLowerCase();
    const __FUNCTION__ = "refund";

    let params = [
        result.status, transId, parameters.id_user, __FUNCTION__,
        parameters.product_id, JSON.stringify(parameters), JSON.stringify(result), currentTime, currentTime
    ];
    const value = "(" + "?,".repeat(params.length - 1) + "?)";
    const sql = "INSERT INTO log_agent (`status`, `transaction_id`, `account`, `function`, `agent`, `data_input`, `data_output`, `created_at`, `updated_at`) VALUES " + value;
    console.log(sql);
    return modelCore.doQuery(sql, params);
}

module.exports=LogAgent;