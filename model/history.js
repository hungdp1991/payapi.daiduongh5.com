let history = {};

history.getCardCharge = function(parameters){
    const sql = "CALL sp_card_get_historydatetodate ("+parameters.in_transaction+","+parameters.in_username+","+parameters.in_serial+","+parameters.in_code+","+parameters.fromDate+
        ","+parameters.toDate+","+parameters.in_status+","+parameters.in_type+","+parameters.in_product_id+")";
    return doQuery(sql);
}

history.getPayToGame = function(parameters){
    const sql = "CALL sp_pay_get_historydatetodate ("+parameters.in_transaction+","+parameters.in_username+","+parameters.in_role+","+parameters.in_serial+","+parameters.in_code+","+parameters.fromDate+
        ","+parameters.toDate+","+parameters.in_status+","+parameters.in_server+","+parameters.in_type+","+parameters.in_product_id+")";
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

module.exports = history;