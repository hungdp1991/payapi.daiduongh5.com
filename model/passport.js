const axios = require('axios');
var md5 = require('md5');
const fs = require('fs');
var moment = require('moment');
// var Config = require('../config');


class Passport {
    constructor(config) {
        //define properties
        this.config = config;
    }

    async login(username, password) {
        try {
            let config = this.config
            const sign = md5(config.key + md5(username + md5(password)) + config.secret);
            const WSDL_URI_reg = "/passports/authenticate";
            const link = config.domain + WSDL_URI_reg + '?agent=' + config.agent + '&key=' + encodeURI(config.key) + '&username=' + username + '&sign=' + sign + '&password=' + md5(password);
            const response = await axios.get(link);
            const string = "authenticatePassport #agent:" + config.agent + " #username:" + username + " #status: " + response.data.status;
            this.saveLogFile(string);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    };

    async getUser(username) {
        try {
            let config = this.config
            const sign = md5(config.key + md5(username) + config.secret);
            const _WSDL_URI_reg = "/passports/profile";
            const link = config.domain + _WSDL_URI_reg + '?agent=' + config.agent + '&key=' + encodeURI(config.key) + '&username=' + username + '&sign=' + sign;
            const response = await axios.get(link);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Authenticate with Facebook / Google
     * @param source
     * @param info
     * @returns {Promise<AxiosResponse<T>>}
     * @created 2020-03-05 LongTHk
     */
    authenticateWithoutSide(source, info) {
        // get passport services
        let passportService = this.config;

        return axios.get(passportService.domain + '/passports/authenticatewithoutside' +
            '?agent=' + passportService.agent +
            '&key=' + passportService.key +
            '&source=' + source +
            '&info=' + info +
            '&sign=' + md5(passportService.key + md5(info) + passportService.secret))
            .catch((error) => {
                console.log(error)
            })
    }

    saveLogFile(string) {
        const currentDate = moment().format('YYYY_MM_DD');
        const path = 'public/logs/user/' + currentDate + '.txt';
        fs.stat(path, function (err, stat) {
            if (err == null) {
                fs.appendFile(path, '\r\n' + string, (err) => {
                    if (err) throw err;
                });
            } else if (err.code === 'ENOENT') {
                fs.writeFile(path, string, function (err) {
                    if (err) throw err;
                });
            } else {
                console.log('Some other error: ', err.code);
            }
        });
    }
}

module.exports = Passport;
