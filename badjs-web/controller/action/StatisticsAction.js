/**
 * Created by chriscai on 2015/1/15.
 */
var BusinessService = require('../../service/BusinessService'),
    _ = require('underscore'),
    StatisticsService = require('../../service/StatisticsService');

var log4js = require('log4js'),
    logger = log4js.getLogger();

// 匹配 2019-08-02
const DATE_REG = /^(?:(?!0000)[0-9]{4}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[0-9]{2}(?:0[48]|[2468][048]|[13579][26])|(?:0[48]|[2468][048]|[13579][26])00)-02-29)$/;

var StatisticsAction = {

    index: function (param, req, res) {
        var params = req.query,
            user = req.session.user;

        var businessService = new BusinessService();

        businessService.findBusinessByUser(user.loginName, function (err, item) {
            res.render(param.tpl, {
                layout: false,
                user: user,
                index: 'statistics',
                statisticsTitle: param.statisticsTitle,
                items: item
            });
        });
    },

    findBusinessByUser: function (param, req, res) {
        var params = req.query,
            user = req.session.user;

        var businessService = new BusinessService();

        businessService.findBusinessByUser(user.loginName, function (err, item) {
            if (err) {
                res.json({ code: 500, data: err });
            } else {
                res.json({ code: 200, data: item });
            }
        });
    },

    getRate: function (param, req, res) {
        var db = global.models.db,
            date = param.date.replace(/\D/g, '');
        const ids = param.badjsid;
        db.driver.execQuery('select * from b_quality where date=' + date + ' and badjsid in (' + ids + ');',
            (err, data = []) => {
                res.json({
                    data: data,
                    retcode: 0
                });
            });
    },
    projectTotal: function (param, req, res) {
        var params = req.query,
            user = req.session.user;

        var businessService = new BusinessService();

        businessService.findBusiness(function (err, items) {
            res.render(param.tpl, {
                layout: false,
                user: user,
                index: 'projectTotal',
                statisticsTitle: param.statisticsTitle,
                items: items
            });
        });

    },
    queryByChart: function (param, req, res) {
        var statisticsService = new StatisticsService();
        if (!param.projectIds || !param.timeScope) {
            res.json({
                ret: 0,
                msg: 'invalid query'
            });
            return;
        }
        statisticsService.queryByChart({
            userName: req.session.user.loginName,
            projectId: param.projectIds.split(','),
            timeScope: param.timeScope - 0
        }, function (err, data) {
            if (err) {
                res.json({
                    ret: -1,
                    msg: "error"
                });
                return;
            }
            res.json(data);
        });
    },
    queryByChartForAdmin: function (param, req, res) {
        var statisticsService = new StatisticsService();
        if (!param.projectId || isNaN(param.projectId) || !param.timeScope || req.session.user.role != 1) {
            res.json({
                ret: 0,
                msg: 'success',
                data: {}
            });
            return;
        }

        statisticsService.queryByChart({
            projectId: param.projectId - 0,
            timeScope: param.timeScope - 0
        }, function (err, data) {
            if (err) {
                res.json({
                    ret: -1,
                    msg: "error"
                });
                return;
            }
            res.json(data);
            return;
        });
    },
    queryById: function (param, req, res) {
        var statisticsService = new StatisticsService();
        if (!req.query.projectId || isNaN(req.query.projectId) || !req.query.startDate) {
            res.json({
                ret: 0,
                msg: 'query invalid！',
                data: {}
            });
            return;
        }
        var startDate = new Date(param.startDate + ' 00:00:00');
        statisticsService.queryById({
            userName: req.session.user.loginName,
            projectId: req.query.projectId - 0,
            startDate
        }, function (err, data) {
            if (err) {
                res.json({
                    ret: -1,
                    msg: 'error',
                    data: {}
                });
            } else {
                res.json({
                    ret: 0,
                    msg: 'success',
                    data: data
                });
            }

        });
    },

    getTopError: function (param, req, res) {
        logger.info('查询错误列表' + JSON.stringify(param));
        const { startDate, userName } = param;
        if (!DATE_REG.test(startDate) || !/^[A-Za-z_]{3,20}$/.test(userName)) {
            return res.json({
                ret: -1,
                msg: 'params error'
            });
        }
        const statisticsService = new StatisticsService();
        const { user } = req.session;
        logger.info(user);
        const isAdmin = user.role === 1;
        const { loginName } = user;
        let searchName = loginName;
        if (isAdmin) {
            searchName = userName || loginName
        }

        statisticsService.getTopError({
            searchName,
            startDate
        }, function (data) {
            res.json({
                ret: 0,
                data
            });
        });
    },

    getpvbyid: function (param, req, res) {
        var statisticsService = new StatisticsService();
        statisticsService.getPvById({
            badjsid: req.query.badjsid,
            date: req.query.date
        }, function (err, data) {
            if (err) {
                res.json({
                    retcode: 2,
                    msg: err
                });
                return;
            }
            res.json(data);
        });
    }
};

module.exports = StatisticsAction;
