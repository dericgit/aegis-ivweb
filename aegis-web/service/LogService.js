/**
 * Created by chriscai on 2014/12/16.
 */

var http = require('http');

var log4js = require('log4js'),
    BusinessService = require('./BusinessService'),
    WhitelistService = require('./WhitelistService'),
    _ = require('underscore'),
    logger = log4js.getLogger();

var request = require("request");


var LogService = function () {

    this.queryUrl = global.pjconfig.storage.queryUrl;

    // this.url = 'http://127.0.0.1:9000/query';
    logger.debug('query url : ' + this.queryUrl);
};


LogService.prototype = {
    query: function (params, callback) {
        var startDate = new Date;
        var strParams = '';
        for (var key in params) {
            if (key == 'index') {
                strParams += key + "=" + params[key] + "&";
            } else {
                strParams += key + "=" + encodeURIComponent(JSON.stringify(params[key])) + "&";
            }
        }
        strParams += '_=1';
        logger.info('query param : ' + strParams);
        http.get(this.queryUrl + '?' + strParams, function (res) {
            var buffer = '';
            res.on('data', function (chunk) {
                buffer += chunk.toString();
            }).on('end', function () {
                try {
                    callback(null, JSON.parse(buffer));
                } catch (e) {
                    callback(e);
                }
                logger.info('query log spend : ' + (new Date - startDate) + "ms by " + params.id);
            });

        }).on('error', function (err) {
            logger.warn('error :' + err);
            callback(err);
        });
    },
    pushProject: function () {
        WhitelistService.postToAcceptor();
    }
};


module.exports = LogService;
