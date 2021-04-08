/**
 * Require modules
 */

/**
 * Base controller
 */
const Base = {

    /**
     * Validate number
     * Set page number default when validate fail
     * @param checkingNumber
     * @param defaultNumber
     * @returns {number}
     */
    getValidNumber: function (checkingNumber, defaultNumber) {
        // convert page number to integer
        let number = parseInt(checkingNumber);

        return (!_.isInteger(number) || number <= 0) ? defaultNumber : number;
    },



    /**
     * Generate response structure
     * @param status
     * @param message
     * @param data
     * @returns {{data: *, messages: string, status: number}}
     */
    generateResponse: function (status, message, data = []) {
        return {
            status: status,
            messages: message,
            data: data
        }
    },

    rxChangeAlias: function (x) {
        let str = x;
        if (x) {
            str = str.toLowerCase();
            str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
            str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
            str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
            str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
            str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
            str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
            str = str.replace(/đ/g, "d");
            str = str.replace(/ + /g, " ");
            str = str.replace(/ /g, "-");
            str = str.trim();  
        }
        return str;
    },

    
};


/**
 * Export module
 * @type {{getList: (function(*)), getInfoById: (function(*, *=))}}
 */
module.exports = Base;
