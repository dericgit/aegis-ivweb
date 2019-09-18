const mysql = require('mysql');
const orm = require('orm');
const pjConfig = require('../project.json');

global.pjConfig = pjConfig;

console.log(pjConfig);

console.log(global.pjconfig)

const UserPvService = require('../service/UserPvService');

global.DEBUG = true;


const mysqlUrl = pjConfig.mysql.url;

orm.connect(mysqlUrl, function (err, db) {
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

    var us = new UserPvService();

    us.findBatchPv({ where: { id: 582 } }, function (err, data) {
        console.log(data)
    })

});





