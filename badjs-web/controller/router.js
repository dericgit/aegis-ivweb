/**
 * @info : 页面申请路由
 * @author : coverguo
 * @date : 2014-12-16
 */

const LogAction = require('./action/LogAction');
const ApplyAction = require('./action/ApplyAction');
const SourceMapAction = require('./action/SourceMapAction');
const UserAction = require('./action/UserAction');
const IndexAction = require('./action/IndexAction');
const StatisticsAction = require('./action/StatisticsAction');
const ApproveAction = require('./action/ApproveAction');
const realtimeService = require('../service/RealtimeService');
const UserApplyAction = require('./action/UserApplyAction');
const pluginHandler = require('../workflow/PluginWorker');
const ApiRouter = require('./api');
const StaticServe = require('./static-serve');
const upload = require('./sourcemap');
const WhitelistAction = require('./action/WhitelistAction');
const SpeedRouter = require('./speed/index');

const pjConfig = require('../project.json');

const _ = require('underscore');

const log4js = require('log4js');
const logger = log4js.getLogger();
const homePage = pjConfig.homepage;

const ROLE = {
    ADMIN: 1
};

module.exports = function(app) {
    realtimeService(app);

    app.get('/', function(req, res) {
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(`${global.pjconfig.http_public}/index.html`);
    });

    app.get('/index.html', function(req, res, next) {
        res.redirect(req.protocol + '://' + req.get('host'));
    });

    // global.pjconfig.QQConnect
    app.use('/api', ApiRouter);

    app.use('/speed-server', SpeedRouter);

    app.use('/aegis', StaticServe);

    /**
     * 登出
     * */
    app.get('/logout', function(req, res) {
        if (pluginHandler.login) {
            pluginHandler.login.logout(req, res);
        } else {
            req.session.user = null;
            delete req.session.user;
            res.redirect(homePage);
        }
    });
    //
    // app.post('/upload-sourcemap', upload.array('sourcemap'), function (req, res, next) {
    //     var names = [];
    //     for (var i = 0; i < req.files.length; i++) {
    //         names.push(req.files[i]['originalname']);
    //     }
    //     res.send({ ret: 1, filename: names.join(', ') });
    // });

    // 请求路径为： controller/xxxAction/xxx.do (get || post)
    app.use('/', function(req, res, next) {
        //controller 请求action
        if (!/\/controller/i.test(req.url)) {
            next();
            return;
        }
        var url = req.url;
        var action = url.match(/controller\/(\w*)Action/i)[1];
        var operation = url.match(/\/(\w+)\.do/i)[1];
        logger.debug('the operation is: ' + action + ' --operation: ' + operation);
        //判断是get还是post请求， 获取参数params
        var method = req.method.toLowerCase();
        var params = method == 'get' ? req.query : req.body;

        params = _.extend({}, params);

        // todo:
        // if (!req.session.user) {
        //     res.json({ ret: -2, msg: 'should login' });
        //     return;
        // }

        // if (req.session.user.verify_state !== 2) {
        //     res.json({ ret: -2, msg: 'waiting for admin verify' });
        //     return;
        // }
        //根据不同actionName 调用不同action
        try {
            switch (action) {
                case 'user':
                    UserAction[operation](params, req, res);
                    break;
                case 'apply':
                    ApplyAction[operation](params, req, res);
                    break;
                case 'approve':
                    ApproveAction[operation](params, req, res);
                    break;
                case 'log':
                    LogAction[operation](params, req, res);
                    break;
                case 'userApply':
                    UserApplyAction[operation](params, req, res);
                    break;
                case 'statistics':
                    StatisticsAction[operation](params, req, res);
                    break;
                case 'sourcemap':
                    SourceMapAction[operation](params, req, res);
                    break;
                case 'whitelist':
                    // 统一做层鉴权控制
                    (() => {
                        // todo:
                        // const { role } = req.session.user;
                        const { role } = { role: 1 }
                        if (role !== ROLE.ADMIN) {
                            return res.status(200).json({
                                ret: 1003,
                                msg: '权限不足'
                            });
                        }
                        WhitelistAction[operation](params, req, res);
                    })();
                    break;
                default:
                    next();
            }
        } catch (e) {
            logger.warn(e);
            res.send(404, 'Sorry! can not found action.');
        }
        return;
    });
};
