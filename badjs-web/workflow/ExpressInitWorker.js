const express = require('express');
const tpl = require('express-micro-tpl');
const crypto = require('crypto');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const serveStatic = require('serve-static');
const app = express();
const router = require('../controller/router');
const compress = require('compression');
const orm = require('orm');
const pluginHandler = require('./PluginWorker');
const path = require('path');

const log4js = require('log4js');
const logger = log4js.getLogger();
const mysql = global.pjconfig.mysql;
const msqlUrl = mysql.url;

const sessionStore = new MySQLStore({
    host: mysql.host,
    port: mysql.port,
    user: mysql.user,
    password: mysql.password,
    database: mysql.database
});

app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'html');
app.engine('html', tpl.__express);
app.use(compress());
app.use(session({
    key: 'aegis_session_cookie',
    secret: 'keyboard cat',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    checkExpirationInterval: 900000,
    expiration: 30 * 24 * 60 * 60 * 1000,
    createDatabaseTable: true
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({}));
app.use(cookieParser());

app.use('/static', serveStatic(path.join(__dirname, '..', 'static')));
app.use('/sm', serveStatic(global.pjconfig.sourcemap));


logger.info('connect mysql: ' + msqlUrl);

app.use(orm.express(msqlUrl, {
    define: function (db, models, next) {

        db.use(require('orm-transaction'));
        models.userDao = require('../dao/UserDao')(db);
        models.applyDao = require('../dao/ApplyDao')(db);
        models.sourcemapDao = require('../dao/SourceMapDao')(db);
        models.approveDao = require('../dao/ApproveDao')(db);
        models.userApplyDao = require('../dao/UserApplyDao')(db);
        models.statisticsDao = require('../dao/StatisticsDao')(db);
        models.pvDao = require('../dao/PvDao')(db);
        models.scorevDao = require('../dao/ScoreDao')(db);
        models.db = db;

        global.models = models;
        logger.info('mysql connected');
        next();
    }
}));

app.use(function (err, req, res, next) {
    res.send(err.stack);
});

if (global.pjconfig.oos && global.pjconfig.oos.module) {
    app.use('/user', require('../oos/' + global.pjconfig.oos.module));
}

app.use('/user', function (req, res, next) {
    if (pluginHandler.login) {
        pluginHandler.login.check(req, res, next);
    } else {
        const { user } = req.session;
        if (!user) {
            return res.redirect(req.protocol + '://' + req.get('host') + '/login.html');
        } else if (user.verify_state !== 2) {
            return res.redirect(req.protocol + '://' + req.get('host'));
        } else {
            next();
        }
    }
});

router(app);

// 注册插件路由事件
pluginHandler.registerRoute(app);

logger.info('Listen At Port: ' + global.pjconfig.port);

const port = parseInt(global.pjconfig.port, 10) || 80;
module.exports = function () {
    app.listen(port);
    logger.info('start badjs-web , listen ' + port + ' ...');
};
