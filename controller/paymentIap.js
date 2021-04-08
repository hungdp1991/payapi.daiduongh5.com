var BaseController = require('../controller/base');
var Config = require('../config');
var Validate = require('../utility');
var _ = require('lodash');
var md5 = require('md5');
var Utility = require('../utility');
var moment = require('moment');
var PaymentIap = require('../model/paymentIap');
var PaymentIap = new PaymentIap();

const fs = require('fs');
const axios = require('axios');

let paymentIap = {};

/**
 * PAY IAP
 * @param uid
 * @param server_id
 * @param product_id
 * @param order_vnd
 * @param sign
 * @param payload 
 * @param agent 
 * @param os 
 * @param username 
 * @param roleid 
 * @param order_amount 
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
*/
paymentIap.exchange = async function(req, res){
    const params = req.query;
    //////validate param
    const { uid, server_id, product_id, order_vnd, sign, payload, agent, os, username, roleid, order_amount } = params;
    if(Validate.required(uid) || Validate.required(server_id) || Validate.required(product_id) || Validate.required(order_vnd) 
        || Validate.required(sign) || Validate.required(payload) || Validate.required(agent)
        || Validate.required(os) || Validate.required(username) || Validate.required(roleid) || Validate.required(order_amount) ){
        const msg  = 'field uid, server_id, product_id, order_vnd, sign, payload, agent, os, username, roleid, order_amount is required';
        return res.send(BaseController.generateResponse(0, msg));
    }
    let parameters = {
        uid: uid,
        server_id: server_id ,
        product_id: product_id ,
        item_id: product_id,
        order_vnd: order_vnd,
        sign: sign ,
        payload: payload ,
        agent: agent,
        os: os,
        username: username,
        roleid: roleid,
        money: order_vnd
    };
    parameters.order_amount = parameters.gold = order_amount;
    const config = Config.config.sdk;
    const configGame = Config.config.game[parameters.agent];
    var d = new Date();

    parameters.time = Math.round(d.getTime() / 1000);

    // parameters.time = d.getTime();
    // if (configGame['timeSecond']) {
    //     console.error('Debug: timeSecond');
    //     parameters.time = d.getSeconds();
    // }

    parameters.order_id = parameters.transaction_id =  moment().format('YYYYMMDDHHmmss') + Utility.random(9);
    const keyApp = config.key[parameters.agent];	
    const signServer = md5(parameters.uid + parameters.order_amount + parameters.payload + parameters.server_id + keyApp);
    if(parameters.sign != signServer) {
        return res.send({status: -100, result: 'sign is invalid! ' + sign});
    }

    let jsonResponse = 0;
    try {
        const key = configGame.exchange.key;
        const signGame = md5(parameters.uid + parameters.roleid + parameters.server_id + parameters.order_id + parameters.payload + parameters.product_id + parameters.money + parameters.gold + parameters.time + key);
        parameters.sign = signGame;
        parameters.status = 1;
        ///check function
        const idLogIapChargeLasted = await PaymentIap.saveLogIapCharge(parameters);

        let string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "ChargeIAP'
            +'","agent": "'+parameters.agent
            +'","transaction_id": "'+parameters.transaction_id
            +'","uid": "'+parameters.uid
            +'","username": "'+parameters.username
            +'","server_id": "'+parameters.server_id
            +'","roleid": "'+parameters.roleid
            +'","product_id": "'+parameters.product_id
            +'","order_vnd": "'+parameters.order_vnd
            +'","order_amount": "'+parameters.order_amount
            +'","order_id": "'+parameters.order_id
            +'","time": "'+parameters.time
            +'","payload": "'+parameters.payload
            +'","os": "'+parameters.os
            +'","status": "'+parameters.status+'" }';

        PaymentIap.saveLogFile(parameters.agent, string, "IAP");
        //if insert log success then call charge api
        if (idLogIapChargeLasted) {
            parameters.userid = parameters.uid;
            const link = configGame.exchange.url + '?' + PaymentIap.http_build_query(parameters);

            const response = await axios.get(link);
            console.log('debug');
            console.error(link);
            console.log(response);

            const  result = response.data;
            jsonResponse = result.status || 0;
            console.error("status: " + jsonResponse);


            if (parseInt(jsonResponse) !== 1) {
                parameters.id = idLogIapChargeLasted.insertId;
                parameters.status = parseInt(jsonResponse);
                await PaymentIap.updateLogIapChargeStatus(parameters);
            }
        } else {
            console.error('idLogIapChargeLasted: false');
            string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "getExchangeIap'
                +'","status": "-12'
                +'","message": "insert into log db unsuccess!" }';
            PaymentIap.saveLogFile(parameters.agent, string, "IAP", true);
            return res.send({status: -7, result: 'insert into log unsuccess!' + idLogIapChargeLasted.insertId});
        }
    } catch(err) {
        //for debug
        console.error(err);

        string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "getExchangeIap'
            +'","status": "-13'
            +'","message": "Payload => '+parameters.payload+" Error message => "+err+'" }';
        PaymentIap.saveLogFile(parameters.agent, string, "IAP", true);

        //save log 2
        string = '{ "date": "'+moment().format('HH:mm:ss YYYY-MM-DD')+'", "service": "ChargeIAP'
            +'","agent": "'+parameters.agent
            +'","transaction_id": "'+parameters.transaction_id
            +'","uid": "'+parameters.uid
            +'","username": "'+parameters.username
            +'","server_id": "'+parameters.server_id
            +'","product_id": "'+parameters.product_id
            +'","roleid": "'+parameters.roleid
            +'","order_vnd": "'+parameters.order_vnd
            +'","order_amount": "'+parameters.order_amount
            +'","order_id": "'+parameters.order_id
            +'","time": "'+parameters.time
            +'","payload": "'+parameters.payload
            +'","os": "'+parameters.os
            +'","status": "-13" }';
        PaymentIap.saveLogFile(parameters.agent, string, "IAP", true);
    }
    /*call save log on pm*/
    callSaveLogIapCharge(parameters);

    return res.send({status: jsonResponse});
}

async function callSaveLogIapCharge(parameters) {
    const config = Config.config.payment;
    const domain = config.domain + '/payment/savelogiap';
    const secret = config[parameters.agent].secret;
    const sign = md5(parameters.transaction_id + parameters.uid + parameters.username + parameters.server_id + parameters.product_id + parameters.order_vnd + parameters.order_amount + parameters.agent + secret);
    const link = domain +'?uid='+parameters.uid+'&server_id='+parameters.server_id+'&item_id='+parameters.product_id+'&order_vnd='+parameters.order_vnd
                +'&order_amount='+parameters.order_amount+'&transaction='+parameters.transaction_id+'&agent='+parameters.agent+'&username='+parameters.username+'&sign='+sign;

    // return axios.get(link);

    const response = await axios.get(link);
    return response.data;
}

module.exports = paymentIap;