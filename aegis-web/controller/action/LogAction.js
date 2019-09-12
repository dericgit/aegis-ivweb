/**
 * @info : LOG ACION
 * @author : coverguo
 * @date : 2014-12-16
 */

const LogService = require('../../service/LogService');
const http = require('http');
const pjConfig = require('../../project.json');
const fs = require("fs");
const path = require("path");
const crypto = require('crypto');
const IP2Region = require('ip2region');
const ipQuery = new IP2Region();

var isError = function (res, error) {
    if (error) {
        res.json({ ret: 1, msg: error });
        return true;
    }
    return false;
};


var LogAction = {
    queryLogList: function (params, req, res) {

        var logService = new LogService();

        params['endDate'] -= 0;
        params['startDate'] -= 0;
        params['id'] -= 0;
        delete params.user;
        logService.query(params, function (err, items) {
            if (isError(res, err)) {
                return;
            }
            items.forEach(item => {
                item.region = ipQuery.search(item.ip);
            });
            res.json({ ret: 0, msg: "success-query", data: items });
        });
    },
    showOfflineFiles: function (params, req, res) {
        if (!params.id || !/^[0-9]{1,5}$/.test(params.id)) {
            res.json({ ret: 0, msg: "success-query", data: [] });
            return;
        }

        var filePath = path.join(pjConfig.offline_log, params.id + "");


        if (!fs.existsSync(filePath)) {
            res.json({ ret: 0, msg: "success-query", data: [] });
            return;
        }

        var offlineFiles = fs.readdirSync(filePath);
        var offlineFilesList = [];
        offlineFiles.sort(function (a, b) {
            if (a < b) {
                return 1;
            } else {
                return -1;
            }
        });

        offlineFiles = offlineFiles.slice(0, 50);

        offlineFiles.forEach(function (item) {
            offlineFilesList.push({
                id: item
            });
        });

        res.json({ ret: 0, msg: "success-query", data: offlineFilesList });

    },

    showOfflineLog: function (params, req, res) {
        if (!/^\w{1,60}$/.test(params.fileId)) {
            return res.json({ ret: 0, msg: "success-query", data: '' });
        }

        if (!/^[0-9]{1,5}$/.test(params.id)) {
            return res.json({ ret: 0, msg: "success-query", data: '' });
        }

        if (!params.fileId || !params.id) {
            res.json({ ret: 0, msg: "success-query", data: '' });
            return;
        }

        var filePath = path.join(pjConfig.offline_log, params.id + "", params.fileId);

        if (!fs.existsSync(filePath)) {
            res.json({ ret: 0, msg: "success-query", data: '' });
            return;
        }

        var offlineFiles = fs.readFileSync(filePath);

        res.json({ ret: 0, msg: "success-query", data: offlineFiles.toString() });

    },

    deleteOfflineLogConfig: function (params, req, res) {
        if (!params.id || !params.uin) {
            res.json({ ret: 0, msg: "", data: {} });
            return;
        }

        if (global.offlineLogMonitorInfo[params.id] && global.offlineLogMonitorInfo[params.id][params.uin]) {
            delete global.offlineLogMonitorInfo[params.id][params.uin];
        }

        res.json({ ret: 0, msg: "", data: {} });
    },

    getOfflineLogConfig: function (params, req, res) {
        if (!params.id) {
            res.json({ ret: 0, msg: "", data: {} });
            return;
        }

        var result = {};
        if (global.offlineLogMonitorInfo[params.id]) {
            result = global.offlineLogMonitorInfo[params.id];
        }

        res.json({ ret: 0, msg: "", data: result });
    },

    addOfflineLogConfig: function (params, req, res) {
        if (!params.id || !params.uin) {
            res.json({ ret: -1, msg: "", data: {} });
            return;
        }

        if (!global.offlineLogMonitorInfo[params.id]) {
            global.offlineLogMonitorInfo[params.id] = {};
        }
        const hmac = crypto.createHmac('sha256', global.pjconfig.secretKey);

        hmac.update(params.uin + '' + params.id);

        var hadAdd = false;
        if (!global.offlineLogMonitorInfo[params.id][params.uin]) {
            global.offlineLogMonitorInfo[params.id][params.uin] = hmac.digest('hex');
        } else {
            hadAdd = true;
        }
        console.log('new offline monitor info:', global.offlineLogMonitorInfo);

        res.json({ ret: 0, msg: "success-query", data: { hadAdd: hadAdd } });
    },

    code: function (params, req, res) {
        http.get(params.target, function (response) {
            var buffer = '';
            response.on('data', function (chunk) {
                buffer += chunk.toString();
            }).on('end', function () {
                res.json({ ret: 0, msg: "success-query", data: buffer });
            });
        });
    }
};

module.exports = LogAction;

