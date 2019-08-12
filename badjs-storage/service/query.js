/**
 * Created by chriscai on 2014/10/14.
 */

const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');

const log4js = require('log4js'),
    logger = log4js.getLogger();

const fs = require("fs");
const path = require("path");

//const realTotal = require('../service/realTotal');

const url = global.MONGODB.url;
const LIMIT = global.MONGODB.limit || 500;

let mongoDB;
// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
    if (err) {
        logger.info("failed connect to server");
    } else {
        logger.info("Connected correctly to server");
    }
    mongoDB = db.db('badjs');
});

const app = express();

app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: 2 * 1024 * 1024
}));

const dateFormat = function (date, fmt) {
    var o = {
        "M+": date.getMonth() + 1, //月份
        "d+": date.getDate(), //日
        "h+": date.getHours(), //小时
        "m+": date.getMinutes(), //分
        "s+": date.getSeconds(), //秒
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度
        "S": date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

const validateDate = function (date) {
    var startDate = new Date(date - 0) - 0;
    if (isNaN(startDate)) {
        return {
            ok: false,
            msg: 'date error'
        };
    }

};

const validate = function (req, rep) {
    var json = req.query;

    var id;
    if (isNaN((id = req.query.id - 0)) || id <= 0 || id >= 9999) {
        return {
            ok: false,
            msg: 'id is required'
        };
    }

    if (!json.startDate || !json.endDate) {
        return {
            ok: false,
            msg: 'startDate or endDate is required'
        };
    }


    try {
        var startDate = new Date(json.startDate - 0);
        var endDate = new Date(json.endDate - 0);
        json.startDate = startDate;
        json.endDate = endDate;
    } catch (e) {
        return {
            ok: false,
            msg: 'startDate or endDate parse error'
        };
    }

    try {
        if (json.include) {
            json.include = JSON.parse(json.include);
        } else {
            json.include = [];
        }

        if (json.exclude) {
            json.exclude = JSON.parse(json.exclude);
        } else {
            json.exclude = [];
        }
    } catch (e) {
        return {
            ok: false,
            msg: 'include or exclude parse error'
        };
    }

    try {
        if (json.level) {
            if (Object.prototype.toString.apply(json.level) == "[object Array]") {
            } else {
                json.level = JSON.parse(json.level);
            }
        } else {
            json.level = [];
        }
    } catch (e) {
        return {
            ok: false,
            msg: 'level parse error'
        };
    }

    return {
        ok: true
    };
};

var getErrorMsgFromCache = function (query, isJson, cb) {
    var fileName = dateFormat(new Date(query.startDate), "yyyy-MM-dd") + "__" + query.id;
    var filePath = path.join(__dirname, "..", "cache", "errorMsg", fileName);

    var returnValue = function (err, doc) {
        if (query.noReturn) {
            cb(err);
        } else {
            cb(err, doc);
        }
    };
    if (fs.existsSync(filePath)) {
        logger.info("get ErrorMsg from cache id=" + query.id);
        if (isJson) {
            returnValue(null, JSON.parse(fs.readFileSync(filePath)));
        } else {
            returnValue(null, fs.readFileSync(filePath));
        }
    } else {
        logger.info("could not found cache  id=" + query.id);
        returnValue(null, '');
    }
};


module.exports = function () {
    app
        .use('/query', function (req, res) {
            var result = validate(req, res);

            if (!result.ok) {
                res.writeHead(403, {
                    'Content-Type': 'text/html'
                });
                res.statusCode = 403;
                res.write(JSON.stringify(result));
                return;
            }

            var json = req.query;
            var id = json.id,
                startDate = json.startDate.getTime(),
                endDate = json.endDate.getTime();

            var uinReg = /^[1-9][0-9]{4,13}$/gim;
            var guidReg = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/;

            var queryJSON = {
                all: {}
            };

            var includeJSON = [];
            json.include.forEach(function (value, key) {
                if (uinReg.test(value) || guidReg.test(value)) {
                    queryJSON.uin = value
                    return;
                }
                includeJSON.push(new RegExp(value));
            });

            if (includeJSON.length > 0) {
                queryJSON.all.$all = includeJSON;
            }

            var excludeJSON = [];
            json.exclude.forEach(function (value, key) {
                excludeJSON.push(new RegExp(value));
            });

            if (excludeJSON.length > 0) {
                queryJSON.all.$not = {
                    $in: excludeJSON
                };
            }

            if (includeJSON.length <= 0 && excludeJSON.length <= 0) {
                delete queryJSON.all;
            }

            json.level.forEach(function (value, key) {
                json.level[key] = value - 0;
            });


            queryJSON.date = {
                $lt: endDate,
                $gt: startDate
            };


            queryJSON.level = {
                $in: json.level
            };

            if (json.index - 0) {
                json.index = (json.index - 0);
            } else {
                json.index = 0;
            }

            if (global.debug) {
                logger.debug("query logs id=" + id + ",query=" + JSON.stringify(queryJSON));
            }
            logger.info("query logs id=" + id + ",query=" + JSON.stringify(queryJSON));

            mongoDB.collection('badjslog_' + id).find(queryJSON, function (error, cursor) {
                res.writeHead(200, {
                    'Content-Type': 'text/json'
                });

                cursor.sort({
                    'date': -1
                })
                    .skip(json.index * LIMIT)
                    .limit(LIMIT)
                    .toArray(function (err, item) {
                        res.write(JSON.stringify(item));
                        res.end();

                    });


            });


        })
        .use('/errorMsgTop', function (req, res) {
            var error = validateDate(req.query.startDate);
            if (error) {
                res.end(JSON.stringify(error));
                return;
            }


            req.query.startDate = req.query.startDate - 0;

            getErrorMsgFromCache(req.query, false, function (error, doc) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': doc.length
                });
                res.write(doc);
                res.end();
            });

        })
        .listen(global.pjconfig.port);

    logger.info('query server start ok , listen ' + global.pjconfig.port);
};
