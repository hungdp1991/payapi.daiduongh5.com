exports.required = function (name){
    return typeof(name) === 'undefined' || name === '';
}

exports.random = function (length){
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

exports.timeSeconds = function() {
    let d = new Date();
    return Math.round(d.getTime() / 1000);
};

exports.http_build_query= function(jsonObj){
    return Object.entries(jsonObj).map(([key, val]) => `${key}=${val}`).join('&');
}