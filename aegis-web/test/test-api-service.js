
const path = require('path');
const orm = require('orm');

global.pjconfig = require(path.join(__dirname, "..", 'project.json'));

const msqlUrl = global.pjconfig.mysql.url;

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
    const { registListWhitelist } = require('../service/apis/ApiService');

    registListWhitelist(497, data => {
        console.log(data);
    });
});
