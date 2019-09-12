/**
 * @info : APPLY ACION
 * @author : coverguo
 * @date : 2015-01-07
 */

var log4js = require('log4js'),
    logger = log4js.getLogger(),
    _ = require('underscore'),
    crypto = require('crypto'),
    ApplyService = require('../../service/ApplyService'),
    UserService = require('../../service/UserService'),
    isError = function(res, error) {
        if (error) {
            res.json({
                ret: 1,
                msg: error
            });
            return true;
        }
        return false;
    };

var REG_DOMAIN_STAR = /^\*(\.[^\/]+)?$/;
var REG_REFERER = /^https?:\/\/[^\/]+\//i;

var _process = function(value, key) {
    if (value.createTime) {
        value.createTime = new Date(value.createTime) - 0;
    }

    if (value.passTime) {
        value.passTime = new Date(value.passTime) - 0;
    }
};

var processData = function(data) {
    if (data.length) {
        _.each(data, _process);
    } else {
        _process(data);
    }
    return data;
};

var applyAction = {
    addApply: function(params, req, res) {
        // 必要信息为空，则报错
        var url = params.url;
        var url_no_match = !REG_DOMAIN_STAR.test(url) && !REG_REFERER.test(url);
        if (!params.name) {
            return res.json({
                ret: 1002,
                msg: '项目名不能为空，请重新填写'
            });
        }
        if (url_no_match) {
            return res.json({
                ret: 1002,
                msg: '业务url有误，请重新填写'
            });
        }
        if (!params.userName) {
            return res.json({
                ret: 1002,
                msg: '负责人不能为空，请重新填写'
            });
        }
        var userService = new UserService();
        userService.findOne({ loginName: params.userName }, item => {
            if (item && item.loginName == params.userName) {
                var apply = params;

                var applyService = new ApplyService();
                if (apply.id) {
                    applyService.update(apply, function(err, items) {
                        if (isError(res, err)) {
                            return;
                        }
                        res.json({
                            ret: 0,
                            msg: 'success-add'
                        });
                    });
                } else {
                    apply.user = req.session.user;
                    apply.userName = req.session.user.loginName;
                    apply.status = 0;
                    apply.createTime = new Date();
                    apply.codePath = params.codePath;
                    apply.appkey = crypto
                        .createHash('md5')
                        .update(new Date() - 0 + 'badjsappkey' + req.session.user.loginName)
                        .digest('hex');

                    if (apply.limitpv == '') {
                        apply.limitpv = 0;
                    }
                    applyService.add(apply, function(err, items) {
                        if (isError(res, err)) {
                            return;
                        }
                        res.json({
                            ret: 0,
                            msg: 'success-add'
                        });
                    });
                }
            } else {
                return res.json({
                    ret: 1002,
                    msg: '负责人不存在，请修改后重新添加'
                });
            }
        });
    },

    queryListByUser: function(params, req, res) {
        var applyService = new ApplyService();
        if (req.session.user.role != 1) {
            applyService.queryListByUser(params, function(err, items) {
                if (isError(res, err)) {
                    return;
                }
                res.json({
                    ret: 0,
                    msg: 'success',
                    data: {
                        role: req.session.user.role,
                        item: processData(items)
                    }
                });
            });
        } else {
            applyService.queryListByAdmin(params, function(err, items) {
                if (isError(res, err)) {
                    return;
                }
                res.json({
                    ret: 0,
                    msg: 'success',
                    data: {
                        role: req.session.user.role,
                        item: processData(items)
                    }
                });
            });
        }
    },
    queryListByAdmin: function(params, req, res) {
        var applyService = new ApplyService();
        //不是管理员的话直接返回错误提示
        if (req.session.user.role != 1) {
            res.json({
                ret: 1003,
                msg: '权限不足'
            });
            return;
        }
        applyService.queryListByAdmin(params, function(err, items) {
            if (isError(res, err)) {
                return;
            }
            res.json({
                ret: 0,
                msg: 'success',
                data: processData(items)
            });
        });
    },
    queryListBySearch: function(params, req, res) {
        var applyService = new ApplyService();

        var searchParam = {};
        if (req.session.user.role != 1) {
            searchParam.userName = req.session.user.loginName;
        }

        //搜索全部
        if (params.statusType != 3) {
            searchParam.status = params.statusType;
        }

        applyService.queryListBySearch(searchParam, function(err, items) {
            if (isError(res, err)) {
                return;
            }
            res.json({
                ret: 0,
                msg: 'success',
                data: {
                    role: req.session.user.role,
                    item: processData(items)
                }
            });
        });
    },
    queryByApplyId: function(params, req, res) {
        var applyService = new ApplyService();
        applyService.queryById(
            {
                id: params.applyId
            },
            function(err, apply) {
                if (err) {
                    res.json({
                        ret: 3,
                        msg: err
                    });
                } else {
                    res.json({
                        ret: 0,
                        data: processData(apply)
                    });
                }
            }
        );
    },
    get: function(params, cb) {
        var applyService = new ApplyService();
        applyService.queryById(
            {
                id: params.applyId
            },
            function(err, apply) {
                cb(err, apply);
            }
        );
    },
    update: function(params, req, res) {
        var as = new ApplyService();
        as.update(params, function() {});
    },
    remove: function(params, req, res) {
        var applyService = new ApplyService();
        applyService.remove(params, function(err) {
            if (err) {
                res.json({
                    ret: 3,
                    msg: 'fail remove'
                });
            } else {
                res.json({
                    ret: 0,
                    msg: 'success remove'
                });
            }
        });
    }
};

module.exports = applyAction;
