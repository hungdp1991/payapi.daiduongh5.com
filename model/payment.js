const axios = require('axios');
var md5 = require('md5');
var Utility = require('../utility');
var Config = require('../config');
var moment = require('moment');
const fs = require('fs');
var _ = require('lodash');
var os = require("os");

Payment = {
    getBalance: async function(username, agent, config){
        const sign = md5 ( config[agent].key + md5 ( username ) + config[agent].secret );
        const WSDL_URI_reg =  "/payment/getbalance";
        const link = config.domain + WSDL_URI_reg + '?agent='+agent  + '&key='+ encodeURI(config[agent].key) + '&username='+username + '&sign='+sign;
        console.error('GET BALANCE:');
        console.error(link);

        const response = await axios.get(link);
        return response.data;
    },

    updateBalance: async function(parameters, config){
        const _WSDL_URI_reg = "/payment/updatebalance";
        const sign = md5( config[parameters.product_id].key + md5(parameters.in_username) + config[parameters.product_id].secret);
        const link = config.domain + _WSDL_URI_reg 
                +'?agent='+parameters.product_id+'&key='+encodeURI(config[parameters.product_id].key)+'&username='+parameters.in_username 
                +'&gold='+parameters.in_amount+'&action=-1&sign='+sign;
        console.error('UPDATE BALANCE:');
        console.error(link);

        const response = await axios.get(link);
        const result = response.data;

        console.error('RESULT UPDATE BALANCE:');
        console.error(result);

        parameters.cardMessage = result.status == 1 ? 'Trừ tiền thành công' : 'Trừ tiền thất bại';
        if(result.status ==1 ) parameters.balance = result.balance;
        parameters.card_status = parseInt(result.status);
        parameters.status = 1;
        parameters.in_pin = parameters.in_serie = '';
        //save log file update balance
        const string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "UpdateBalance'
            +'","agent": "'+parameters.product_id
            +'","productAgent": "'+parameters.product_id
            +'","username": "'+parameters.in_username
            +'","userId": "'+parameters.id_user
            +'","email": "'+parameters.in_email
            +'","amount": "'+parameters.in_amount
            +'","cardCode": "'+parameters.in_pin
            +'","transactionId": "'+parameters.transId
            +'","cardStatus": "'+parameters.card_status
            +'","balance": "'+parameters.balance
            +'","cardMessage": "'+parameters.cardMessage+'" }';
        saveLogFile(parameters.product_id, string, parameters.in_type);
        switch (parameters.card_status) {
            case 1:
                parameters.cardMessage = 'Trừ tiền thành công';
                break;
            case -9:
                parameters.cardMessage = 'Số dư không đủ để thực hiện giao dịch';
                break;
            default:
                parameters.cardMessage = 'Trừ tiền thất bại';
                break;
        }
        saveLogCharge(parameters);
        return {
            status: parameters.card_status,
            balance: parameters.balance
        }
    },  

    chargeCardWallet: async function(parameters){
        try {
            var d = new Date();
            const config = Config.config.payment;
            parameters.transId = (parameters.in_type + d.getTime() + Utility.random(7)).toLowerCase();
            parameters.sign = md5(config[parameters.product_id].key + md5(parameters.in_username + parameters.in_serie) + config[parameters.product_id].secret);
            const WSDL_URI_reg = "/payment/chargecardinwallet";
            const link = config.domain + WSDL_URI_reg + '?agent=' + parameters.product_id  + '&key=' + encodeURI(config[parameters.product_id].key) + '&username='+parameters.in_username
            + '&cardCode='+parameters.in_pin + '&cardSerial='+parameters.in_serie + '&cardType='+parameters.in_type + '&sign='+parameters.sign;
            const response = await axios.get(link);
            const result = response.data;
            console.error(link);
            console.error(result);
            if(result.status == 1){
                parameters.status       = 1;
                parameters.cardMessage  = "Nạp thẻ thành công";
                parameters.in_amount    = result.result.amount;
                parameters.in_gold      = result.result.gold;
                parameters.transId      = result.result.transid;
                parameters.balance      = result.result.balance;
            }else{
                parameters.status = -1;
                parameters.cardMessage = 'Nạp thẻ thất bại';
                parameters.in_amount = 0;
                parameters.in_gold = 0;
                parameters.balance = 0;
            }
            parameters.card_status  = result.status;

            const string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "ChargeCard'
                +'","productAgent": "'+parameters.product_id
                +'","username": "'+parameters.in_username
                +'","userId": "'+parameters.id_user
                +'","email": "'+parameters.in_email
                +'","cardSerial": "'+parameters.in_serie
                +'","cardCode": "'+parameters.in_pin
                +'","cardType": "'+parameters.in_type
                +'","sign": "'+parameters.sign
                +'","transactionId": "'+parameters.transId
                +'","amount": "'+parameters.in_amount
                +'","cardMessage": "'+parameters.cardMessage
                +'","cardTransid": "'+parameters.transId
                +'","cardStatus": "'+parameters.card_status+'" }';
            saveLogFile(parameters.product_id, string, parameters.in_type);
            parameters.cardMessage = message(parameters.card_status);
            saveLogCharge(parameters);
            return {status: parameters.card_status, msg: parameters.cardMessage, balance: parameters.balance};
        } catch (error) {
            console.error(error);
        }
    },

    chargeAtm: async function(parameters, config){
        try {
            var d = new Date();
            parameters.transId = parameters.product_id + d.getTime() + Utility.random(7);
            parameters.sign = md5( config[parameters.product_id].key + md5(parameters.in_username) + config[parameters.product_id].return + config[parameters.product_id].secret );
            const link = config.domain + config.WSDL_URI_reg  + '?agent='+parameters.product_id+'&username='+parameters.in_username 
            +'&amount='+parameters.in_amount+'&backUrl='+encodeURI(config[parameters.product_id].backUrl)+'&returnUrl='+ Config.config.currentDomain + "/paymentWallet/success-charge-atm"
            +'&key='+encodeURI(config[parameters.product_id].key)+'&return='+config[parameters.product_id].return+'&transId='+parameters.transId+'&sign='+parameters.sign;
            
            parameters.status = parameters.card_status= -200;//Đang chờ trả về
            parameters.cardMessage = 'Waiting return';

            saveLogCharge(parameters);
            //save log file
            const string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "WaitingChargeATM'
                +'","agent": "'+parameters.product_id
                +'","username": "'+parameters.in_username
                +'","userId": "'+parameters.id_user
                +'","transactionId": "'+parameters.transId
                +'","status": "'+parameters.card_status
                +'","amount": "'+parameters.in_amount
                +'","trans_id": "'+parameters.transId
                +'","sign": "'+parameters.sign
                +'","gold": "'+parameters.in_gold
                +'","cardType": "'+parameters.in_type
                +'","message": "'+parameters.cardMessage+'" }';
            saveLogFile(parameters.product_id, string, parameters.in_type);

            return link;
        } catch (err) {
            console.error(err);
        }
    },

    chargeCardReturnValue: async function (parameters, config){
        try {
            parameters.sign = md5(config[parameters.product_id].key + md5(parameters.in_username + parameters.in_serie + config[parameters.product_id].secret));
            const _WSDL_URI_reg = "/payment/chargecardreturnvalue";
            const link = config.domain + _WSDL_URI_reg  
                        + '?agent='+parameters.agent  + '&key='+encodeURI(config[parameters.product_id].key) + '&username='+parameters.in_username 
                        + '&cardCode='+parameters.in_pin + '&cardSerial='+parameters.in_serie
                        + '&cardType='+parameters.in_type + '&sign='+parameters.sign;
            const response = await axios.get(link);
            const result = response.data;
            parameters.in_transaction = parameters.in_type + moment().format('YYYY-MM-DD HH:mm:ss');
            parameters.status = result.status == 1 ? 1 : -1;
            if(result.status == 1){
                parameters.amount = result.result.amount;
                parameters.gold = result.result.gold;
                parameters.cardMessage = 'Nạp thẻ thành công';
                parameters.cardTransid = result.result.transId;
                parameters.balance = result.result.balance;
            }else{
                parameters.amount = 0;
                parameters.gold = 0;
                parameters.cardMessage = 'Nạp thẻ thất bại';
                parameters.cardTransid = ''; 
                parameters.balance = 0;
            }
            parameters.card_status = result.status;
            
            const rates = config[parameters.product_id].rate;
            rates.forEach((rate) => {
                if(rate.type == parameters.in_type){
                    parameters.gold = parseInt(parameters.gold) * rate.rate;
                }
            });
            const string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "ChargeCardReturnValue'
                +'","agent": "'+parameters.agent
                +'","productAgent": "'+parameters.product_id
                +'","username": "'+parameters.in_username
                +'","userId": "'+parameters.id_user
                +'","email": "'+parameters.in_email
                +'","cardSerial": "'+parameters.in_serie
                +'","cardCode": "'+parameters.in_pin
                +'","cardType": "'+parameters.in_type
                +'","sign": "'+parameters.sign
                +'","transactionId": "'+parameters.in_transaction
                +'","amount": "'+parameters.amount
                +'","cardMessage": "'+parameters.cardMessage
                +'","cardTransid": "'+parameters.cardTransid
                +'","cardStatus": "'+parameters.card_status+'" }';
            saveLogFile(parameters.product_id, string, parameters.in_type);
            let msg = null;
            let resultLog = null;
            let status = 0;
            switch(result.status){
                case 1: 
                    resultLog = await saveLogCharge(parameters);
                    if(resultLog && _.head(_.head(resultLog)).result != '1'){
                        msg = "Bạn đã nạp thẻ liên tiếp quá số lần cho phép. Hãy đợi một lát rồi nạp lại nhé";
                        break;
                    }

                    const configGame = Config.config.game;     
                    const resultPayGame = await Game.payToGame(parameters, configGame);
                    parameters.cardMessage = resultPayGame.status == 1 ? 'Nạp tiền vào game thành công' : 'Nạp vào game thất bại';
                    parameters.card_status = resultPayGame.status == 1 ? 1 : -1;
                    const stringUpdate = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "ChargeCardReturnValue'
                        +'","agent": "'+parameters.agent
                        +'","productAgent": "'+parameters.product_id
                        +'","username": "'+parameters.in_username
                        +'","userId": "'+parameters.id_user
                        +'","email": "'+parameters.in_email
                        +'","cardSerial": "'+parameters.in_serie
                        +'","cardCode": "'+parameters.in_pin
                        +'","cardType": "'+parameters.in_type
                        +'","sign": "'+parameters.sign
                        +'","transactionId": "'+parameters.in_transaction
                        +'","amount": "'+parameters.amount
                        +'","cardMessage": "'+parameters.cardMessage
                        +'","cardTransid": "'+parameters.cardTransid
                        +'","cardStatus": "'+parameters.card_status+'" }';
                    saveLogFile(parameters.product_id, stringUpdate, 'exchange');
                    if(resultPayGame.status == 1){
                        status = 1;
                        msg = "Nạp vào game thành công";
                        break;
                    }else{
                        msg = 'Lỗi nạp thẻ vào game, hãy liên hệ với bộ phận CSKH để được hỗ trợ';
                    }
                case -1:
                    msg = 'Tên đăng nhập không hợp lệ';
                    break;
                case -2:
                    msg = 'Email không hợp lệ';
                    break;
                case -3:
                    msg = 'Số serial không hợp lệ';
                    break;
                case -4:
                    msg = 'Mã pin không hợp lệ';
                    break;
                case -5:
                    msg = 'Loại thẻ không hợp lệ';
                    break;
                case 50:
                    parameters.status = -1;
                    parameters.cardMessage = 'Thẻ đã sử dụng hoặc không tồn tại';
                    parameters.card_status = result.status;
                    msg = 'Thẻ đã sử dụng hoặc không tồn tại';
                    resultLog = await saveLogCharge(parameters);
                    if(resultLog && _.head(_.head(resultLog)).result != '1'){
                        msg = "Bạn đã nạp thẻ liên tiếp quá số lần cho phép. Hãy đợi một lát rồi nạp lại nhé";
                    }
                    break;
                case 53: 
                    parameters.status = -1;
                    parameters.cardMessage = 'Thông tin thẻ không đúng';
                    parameters.card_status = result.status;
                    msg = 'Thông tin thẻ không đúng';
                    resultLog = await saveLogCharge(parameters);
                    if(resultLog && _.head(_.head(resultLog)).result != '1'){
                        msg = "Bạn đã nạp thẻ liên tiếp quá số lần cho phép. Hãy đợi một lát rồi nạp lại nhé";
                    }
                    break;
                default: 
                    parameters.status = -1;
                    parameters.cardMessage = 'Nạp thẻ thất bại';
                    parameters.card_status = result.status;
                    msg = 'Nạp thẻ thất bại';
                    resultLog = await saveLogCharge(parameters);
                    if(resultLog && _.head(_.head(resultLog)).result != '1'){
                        msg = "Bạn đã nạp thẻ liên tiếp quá số lần cho phép. Hãy đợi một lát rồi nạp lại nhé";
                    }
                    break;
            }
            return {
                status: status,
                msg: msg
            }
        } catch (err) {
            console.error(err);
        }
    },
    
    getLogCardCharge: function(transId){
        const sql = "Select * from log_card_charge where transaction_id = '" + transId + "' ";
        return doQuery(sql)
    },   

    updateLogCharge: function(parameters) {
        const sql = "CALL sp_card_update_transaction ('"+parameters.trans_id+"',"+parameters.amount+","+parameters.gold+",'"+parameters.cardMessage+"',"+parameters.card_status+","+parameters.status+")";
        return doQuery(sql);
    },

    saveLogFileFn: function(agent, string, type){
        saveLogFile(agent, string, type);
    },

    addHistoryTran: function(transId, serverId){
        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const sql = "INSERT INTO history_trans (`trans_id`, `server_id`, `created_at`) VALUES ('" + transId + "', '" + serverId + "', '" + currentTime + "')";
        return doQuery(sql);
    },

    getHistoryTrans: function(transId){
        const sql = "Select * from history_trans where trans_id = '" + transId + "' ";
        return doQuery(sql);
    }
}

function saveLogFile(agent, string, type) {
    const currentDate = moment().format('YYYY_MM_DD');
    let path = null;
    if(type == 'ATM'){
        path = 'public/logs/' + agent + '/atm/' + currentDate + '.txt';
    }  else if(type == 'exchange'){
        path = 'public/logs/' + agent + '/exchange/' + currentDate + '.txt';
    }  else if(type == 'GOLD'){
        path = 'public/logs/' + agent + '/exchange/gold/' + currentDate + '.txt';
    }else{
        path = 'public/logs/' + agent + '/card/' + type + '/' + currentDate + '.txt';
    }
    
    fs.stat(path, function(err, stat) {
        if(err == null) {
            fs.appendFile(path, '\r\n' + string, (err) => {
                if (err) throw err;
            });
        } else if(err.code === 'ENOENT') {
            fs.writeFile(path, string, function (err) {
                if (err) throw err;
            }); 
        } else {
            console.log('Some other error: ', err.code);
        }
    });
}

function saveLogCharge(parameters){
    const transId = parameters.transId !== undefined ? parameters.transId : parameters.in_transaction;
    const amount = parameters.in_amount !== undefined ? parameters.in_amount : parameters.amount;
    const gold = parameters.in_gold !== undefined ? parameters.in_gold : parameters.gold;
    const sql = "CALL sp_card_insert_transaction ('"+transId+"','"+parameters.in_username+"','"+parameters.in_email
        +"','"+parameters.in_pin+"','"+parameters.in_serie+"','"+parameters.in_type+"',"+parameters.status+","+amount+","+gold
        +",'"+parameters.cardMessage+"',"+parameters.card_status+",'"+transId+"',"+parameters.balance+",'"+parameters.product_id+"')";

    console.log(sql);
    return doQuery(sql);
}

async function doQuery(sql) {
    let pro = new Promise((resolve,reject) => {
        db.query(sql, function (err, result) {
            if (err) throw err; // GESTION D'ERREURS
            resolve(result);
        });
    })
    return pro.then((val) => {
        return val;
    })
}

function message(status){
    let msg = null;
    switch(parseInt(status)) {
        case 1:
            msg = 'Nạp thành công vào ví';
            break;
        case -1:
            msg = 'Thông tin thẻ không đúng';
            break;
        case -3:
            msg = 'Số serial không hợp lệ';
            break;
        case -4:
            msg = 'Mã pin không hợp lệ';
            break;
        case -5:
            msg = 'Loại thẻ không hợp lệ';
            break;
        case 50:
            msg = 'Thẻ đã sử dụng hoặc không tồn tại';
            break;
        case 51:
            msg = 'Số serial không hợp lệ';
            break;
        case 52:
            msg = 'Thông tin mã thẻ không đúng định dạng';
            break;
        case 53:
            msg = 'Thông tin thẻ không đúng';
            break;
        case 59:
            msg = 'Thẻ không tồn tại hoặc chưa được kích hoạt';
            break;
        default:
            msg = 'Nạp thẻ thất bại';
            break;
    }
    return msg;
}


module.exports=Payment;