/**
 * Require modules
 */
const modelCore = require('../model/modelCore');
const tableName = 'charge_type';

/**
 * Define model
 * @type {{getList: (function(): Promise<*>)}}
 */
module.exports = {
    /**
     * Get cards list
     * @returns {Promise<*>}
     */
    getList: () => {
        return modelCore.doQuery('SELECT * FROM ' + tableName + ' WHERE status <> 0');
    }
}