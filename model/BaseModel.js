var moment = require('moment');
const fs = require('fs');

class BaseModel {
    constructor() {

    }

    async saveLogFile(agent, string, type, isErr = false){
        const currentDate = moment().format('YYYY_MM_DD');
        let path = null;
        if(type == 'ATM'){
            path = 'public/logs/' + agent + '/atm/' + currentDate + '.txt';
        }  else if(type == 'exchange'){
            path = 'public/logs/' + agent + '/exchange/' + currentDate + '.txt';
        }  else if(type == 'GOLD'){
            path = 'public/logs/' + agent + '/exchange/gold/' + currentDate + '.txt';
        }  else if(type == 'IAP'){
            path = 'public/logs/' + agent + '/iap/' + currentDate + '.txt';
            if (isErr) {
                path = 'public/logs/' + agent + '/iap/error' + currentDate + '.txt';
            }
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

    http_build_query(jsonObj){
        return Object.entries(jsonObj).map(([key, val]) => `${key}=${val}`).join('&');
    }

    // async doQuery(sql, values = []) {
    //     const pro = db.query(sql, values);
    //     // })
    //     // return pro.then((val) => {
    //     //     return val;
    //     // })
    //     return pro;
    // }
    async doQuery(sql, values = []) {
        let pro = new Promise((resolve,reject) => {
            db.query(sql, values, function (err, result) {
                if (err) throw err; // GESTION D'ERREURS
                resolve(result);
            });
        })
        return pro.then((val) => {
            return val;
        })
    }
}


module.exports = BaseModel;