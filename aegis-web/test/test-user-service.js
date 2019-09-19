const mysql = require('mysql');
const orm = require('orm');
const pjConfig = require('../project.json');

global.pjConfig = pjConfig;

const UserPvService = require('../service/UserPvService');

global.DEBUG = true;


const mysqlUrl = pjConfig.mysql.url;

orm.connect(mysqlUrl, async function (err, db) {
    if (err) {
        throw err;
    }

    global.models = {
        userDao: require('../dao/UserDao')(db),
        applyDao: require('../dao/ApplyDao')(db),
        approveDao: require('../dao/ApproveDao')(db),
        statisticsDao: require('../dao/StatisticsDao')(db),
        userApplyDao: require('../dao/UserApplyDao')(db),
        db: db
    }

    const res = await UserPvService.findBatchPv({ where: { aegis_id: 582 } })
    console.log(res.rows);

});





