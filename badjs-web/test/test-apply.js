//
//
//

var log4js = require('log4js'),
    logger = log4js.getLogger();

var path = require("path");

var orm = require('orm');

global.pjconfig = require(path.join(__dirname, "..", 'project.json'));

var WhitelistService = require('../service/WhitelistService')

var msqlUrl = global.pjconfig.mysql.url;


logger.info('connect mysql: ' + msqlUrl);

orm.connect(msqlUrl, function (err, db) {

    var models = {};
    db.use(require("orm-transaction"));
    models.userDao = require('../dao/UserDao')(db);
    models.applyDao = require('../dao/ApplyDao')(db);
    models.approveDao = require('../dao/ApproveDao')(db);
    models.userApplyDao = require('../dao/UserApplyDao')(db);
    models.statisticsDao = require('../dao/StatisticsDao')(db);
    models.pvDao = require('../dao/PvDao')(db);
    models.db = db;

    global.models = models;
    logger.info('mysql connected');

    models.applyDao.one(497, (err, item) => {
        console.log(err, item.status);
    })

    async function test() {
        let data = await WhitelistService.findBatchUsers({
            where: {
                aegisid: 497
            },
            order: [['id', 'DESC']],
            limit: 2000
        });
        data = Object.assign(data, {status: 1})
        console.log(data);
    }
    test()
});
