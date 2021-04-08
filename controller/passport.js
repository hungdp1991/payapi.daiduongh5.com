var BaseController = require('../controller/base');
var Config = require('../config');
var Passport = require('../model/passport');
var Passport = new Passport(Config.config.passport);
var Validate = require('../utility');
var NetaloLogin = require('../model/NetaloLogin');
var NetaloLogin = new NetaloLogin;

let passport = {};
/**
 * login user 100d
 * @param username
 * @param password
 * @returns {Promise<*|{data: *, messages: string, status: number}>}
 */
passport.login = async function (req, res) {
    const params = req.query;
    let data = {};
    try {
        const {username, password} = params;
        if (Validate.required(username) || Validate.required(password)) {
            data.username = 'field username, password is required';
            return res.send(BaseController.generateResponse(0, 'error', data));
        }

        const user = await Passport.login(username, password);
        let messages = "Sai tên đăng nhập hoặc mật khẩu";
        let status = 0;
        switch (user.status) {
            case 1:
                status = 1;
                data = user.result;
                messages = "success";
                break;
            case 17:
                messages = 'Tên đăng nhập không tồn tại';
                break;
            case 18:
                messages = 'Mật khẩu không đúng';
                break;
        }
        return res.send(BaseController.generateResponse(status, messages, data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
};


passport.getUser = async function(req, res) {
    const params = req.query;
    let data = {};
    try {
        const {username} = params;
        if (Validate.required(username)) {
            data.username = 'field username is required';
            return res.send(BaseController.generateResponse(0, 'error', data));
        }
        const user = await Passport.getUser(username);
        const status = user.status == 1 ? 1 : 0;
        const msg = user.status == 1 ? "success" : "không lấy được thông tin nhân vật";
        data.user = user.status == 1 ? user.result : [];
        return res.send(BaseController.generateResponse(status, msg, data));
    } catch (e) {
        return res.send(BaseController.generateResponse(0, 'intenal server'));
    }
}

/**
 * Facebook authentication callback
 * @param req
 * @param res
 * @created 2020-03-25 LongTHK
 */
passport.loginFB = function (req, res) {
    // call api get access token from FB
    Passport.authenticateWithoutSide('FB', req.query.tokenForBusiness)
        .then((response) => {
            turnBackUserInfo(res, response.data);
        })
        .catch((error) => {
            console.log(error);
        })
};

/**
 * Google authentication callback
 * @param req
 * @param res
 * @created 2020-03-25 LongTHK
 */
passport.loginGoogle = function (req, res) {
    // call api get access token from google
    Passport.authenticateWithoutSide('GG', req.query.email)
        .then((response) => {
            turnBackUserInfo(res, response.data);
        })
        .catch((error) => {
            console.log(error);
        })
};

/**
 * Apple authentication callback
 * @param req
 * @param res
 * @returns {Promise<void>}
 * @created 2020-03-10 LongTHK
 */
passport.loginApple = async function (req, res) {
    Passport.authenticateWithoutSide('AP', req.query.sub)
        .then((response) => {
            turnBackUserInfo(res, response.data)
        })
        .catch((error) => {
            console.log(error);
        })
};

passport.loginNA = async function (req, res) {
    if (req.query.script === undefined) {
        const rt = await NetaloLogin.RequestOTP(req, res);
        return rt;
    }

    //verify otp
    const userInfo = await NetaloLogin.VerifyOTP(req, res);

    try {
        Passport.authenticateWithoutSide('NA', userInfo.phone)
            .then((response) => {
                turnBackUserInfo(res, response.data);
            })
            .catch((error) => {
                console.log(error);
            })
    } catch (e) {
        console.error('viet')
    }
};

/**
 * Build return user info
 * @param res
 * @param userObject
 * @returns {*}
 * @created 2020-03-10 LongTHK
 */
const turnBackUserInfo = function (res, userObject) {
    if (userObject.status === 1) {
        return res.send(BaseController.generateResponse(1, 'success', userObject.result));
    } else {
        return res.send(BaseController.generateResponse(0, 'intenal server', []));
    }
};


module.exports = passport;