var moment = require('moment');
const fs = require('fs');

let modelCore = {};

modelCore.saveLogFile = function(agent, string, type){
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
modelCore.http_build_query = function(jsonObj){
    const keys = Object.keys(jsonObj);
    const values = keys.map(key => jsonObj[key]);
  
    return keys
      .map((key, index) => {
        return `${key}=${values[index]}`;
      })
      .join("&");
}
modelCore.doQuery = async function(sql, values = []) {
    let pro = new Promise((resolve,reject) => {
        db.query(sql, values, function (err, result) {
            if (err) throw err; // GESTION D'ERREURS
            resolve(result);
        });
    })
    return pro.then((val) => {
        return val;
    })
},

module.exports = modelCore;