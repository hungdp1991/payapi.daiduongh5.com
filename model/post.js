/**
 * Require modules
 */
let modelCore = require('../model/modelCore');


/**
 * Define Post model
 * @type {{getAll: (function(): Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>)}}
 */
let PostsModel = {
    /**
     * Get all posts
     * @returns {Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>}
     */
    getAll: function () {
        return modelCore.doQuery("SELECT * FROM posts");
    },

    /**
     * Get post by slug
     * @param slug
     * @returns {Promise<*>}
     */
    getBySlug: function (slug) {
        return modelCore.doQuery("SELECT * FROM posts WHERE slug=\'" + slug + "\'");
    }
};

/**
 * Export Post model
 * @type {{getAll: (function(): Promise<Promise<*>>), getRole: (function(*, *, *): T), doQuery(*=): Promise<*>, saveLogPay(*): *, getGameBySlug: (function(*): Promise<*>), payToGame: Game.payToGame}}
 */
module.exports = PostsModel;