var Server = {
    getServerByGameID: function (id) {
        return this.doQuery("Select * from servers where server_status != 'maintenance' AND pay_status = 1 " +
            "AND product_id = \'" + id + "\'")
    },

    async doQuery(sql) {
        let pro = new Promise((resolve, reject) => {
            db.query(sql, function (err, result) {
                if (err) throw err; // GESTION D'ERREURS
                resolve(result);
            });
        });
        return pro.then((val) => {
            return val;
        })
    }
};

module.exports = Server;