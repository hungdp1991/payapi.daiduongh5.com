
var Gold={
	getGoldByProductAgent:function(agent){
		const sql = "Select * from gold where product_id = ? ORDER BY `product_gold_id` ASC, `amount` ASC";
        return this.doQuery(sql, [agent])
    },

    getGoldById: function(id){
        const sql = "Select * from gold where id = ?";
        return this.doQuery(sql, [id])
    },
	async doQuery(sql, values) {
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
};
module.exports=Gold;