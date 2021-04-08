const axios = require('axios');
// var Config = require('../config');
const crypto = require('crypto');
var Utility = require('../utility');

class NetaloLogin {
    constructor() {
        this.key = "68e462b69973baeb36e8285e20428379c33105da213871cf1bd54b835d0719e0";
    }

    async RequestOTP(req, res) {
        let phone = req.query.phone;
        if (phone === undefined) {
            return res.send({status: 0, msg: "Phone Không Được Bỏ Trống"});
        }

        let naHost = process.env.NA_HOST;
        let naApp = process.env.NA_APP;
        let naKey = process.env.NA_KEY;
        let nonce = 89343;

        let data = {
            application_id: parseInt(naApp),
            auth_key: naKey,
            nonce: nonce,
            timestamp: Utility.timeSeconds()
        };
        const sign = Utility.http_build_query(data);

        data.signature = this.hmacSHA1(naKey, sign);

        try {
            let ret = await axios.post(naHost + "session.json", data);

            if (ret.status != 201 && ret.status != 200) {
                return res.send({status: 0, msg: "Request session failure"})
            }

            const token = ret.data.token;
            let ret2 = await axios.post(naHost + "users/login_by_otp.json", {phone: phone}, {headers: {"TC-Token": token}})
            if (ret.status != 201 && ret.status != 200) {
                console.error(ret.status)
                return res.send({status: 0, msg: "Request OTP failure"})
            }

            let result = {
                token: ret2.data.token,
                phone: phone
            }

            let script = this.encrypt(JSON.stringify(result));

            return res.send({status: 1, script: script});
        } catch (e) {
            console.error('viet')
            console.error(e.response.data)
        }

        return res.send(data);
    }

    async VerifyOTP(req, res) {
        let otp = req.query.otp;
        if (otp === undefined) {
            return res.send({status: 0, msg: "OTP Không Được Bỏ Trống"});
        }

        let script = req.query.script;
        script = this.decrypt(script);
        script = JSON.parse(script);

        let naHost = process.env.NA_HOST;
        let data = {
            "otp": otp
        };

        try {
            let ret = await axios.post(naHost + "users/confirm_login_by_otp.json", data, {
                headers: {
                    "TC-Login-Key": script.token,
                }
            });

            if (ret.status != 201 && ret.status != 200) {
                return res.send({status: 0, msg: "OTP Không Hợp Lệ"})
            }

            // const token = ret.data.Data.token;
            // let ret2 = await axios.get(naHost + "session.json", {headers: {"TC-Token": token}});
            // if (ret.status != 201 && ret.status != 200) {
            //     return res.send({status: 0, msg: "Không thể lấy thông user"})
            // }

            return {
                status: 1,
                phone: script.phone
                // userId: ret2.data.user_id,
            };
        } catch (e) {
            console.error('viet')
            console.error(e)
        }

        return res.send({status: 0, msg: "OTP Không Hợp Lệ"});
    }

    encrypt(text, key = this.key) {
        const algorithm = 'aes-256-cbc';

        let bkey = Buffer.from(key, 'hex');
        let iv = Buffer.from(key.substr(0, 32), 'hex');

        let cipher = crypto.createCipheriv(algorithm, bkey, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString('hex');
    }

    decrypt(text, key = this.key) {
        const algorithm = 'aes-256-cbc';

        let bkey = Buffer.from(key, 'hex');
        let iv = Buffer.from(key.substr(0, 32), 'hex');

        let encryptedText = Buffer.from(text, 'hex');
        let decipher = crypto.createDecipheriv(algorithm, bkey, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    hmacSHA1(key, data) {
        // hmac.digest([encoding])
        // If encoding is provided a string is returned; otherwise a Buffer is returned;
        return crypto.createHmac('sha1', key).update(data).digest('hex');
    }
}

module.exports = NetaloLogin;
