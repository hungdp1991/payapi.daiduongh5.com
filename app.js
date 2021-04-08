var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql');
var cors = require('cors')
var indexRouter = require('./routes/index');
var postRouter = require('./routes/post');
var gameRouter = require('./routes/game');
var sliderRouter = require('./routes/sliders');
var ServerRouter = require('./routes/server');
var CardRouter = require('./routes/Card');
var PassportRouter = require('./routes/passport.js');
var HistoryRouter = require('./routes/history');
var PaymentWalletRouter = require('./routes/paymentWallet');
var PaymentGameRoute = require('./routes/paymentGame');
var PaymentIap = require('./routes/paymentIap');
///update env 
const dotenv = require('dotenv');
dotenv.config();

var app = express();
app.use(cors());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true
});
// process.on('uncaughtException', function (err) {
//   console.log(err);
// })
// connect to database
// db.connect((err) => {
//     if (err) {
//         throw err;
//     }
//     console.log('Connected to database');
// });
global.db = db;
global.jwtToken = process.env.jwtToken;
// view engine setup
////
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

////router
app.use('/', indexRouter);
app.use('/post', postRouter);
app.use('/game', gameRouter);
app.use('/server', ServerRouter);
app.use('/card', CardRouter);
app.use('/sliders', sliderRouter);
app.use('/passport', PassportRouter);
app.use('/history', HistoryRouter);
app.use('/paymentWallet', PaymentWalletRouter);
app.use('/paymentGame', PaymentGameRoute);
app.use('/iap', PaymentIap);
// catch 404 and forward to error handler

app.use(function (req, res, next) {
    res.status(404).end('Page not found');
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    console.error(err)
    // render the error page
    res.status(err.status || 500);
    res.render('error');

});

module.exports = app;
