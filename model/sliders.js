/**
 * Require modules
 */
let modelCore = require('../model/modelCore');


/**
 * Define Slider model
 * @type {{getAll: (function(): Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>)}}
 */
let SlidersModel = {
    /**
     * Get default slider
     * @returns {Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>|Promise<Promise<*>>}
     */
    getDefaultSlider: function () {
        return modelCore.doQuery("SELECT * FROM sliders WHERE is_default <> 0");
    }
};

/**
 * Export Post model
 * @type {{getAll: (function(): Promise<Promise<*>>), getRole: (function(*, *, *): T), doQuery(*=): Promise<*>, saveLogPay(*): *, getGameBySlug: (function(*): Promise<*>), payToGame: Game.payToGame}}
 */
module.exports = SlidersModel;