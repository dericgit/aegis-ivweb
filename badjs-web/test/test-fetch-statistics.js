
var mysql = require('mysql'),
    StatisticsService = require('../service/StatisticsService'),
    orm = require('orm');

global.pjconfig = require('../project.json');
//global.DEBUG = true;
var mysqlUrl = global.pjconfig.mysql.url

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


    var aa = new StatisticsService();


    // var startDate = new Date('2015-09-23 00:00:00');
    // var nowDate = new Date;
    // var id = 991;
    // //fetch data until today
    //     aa.fetchAndSave(id , startDate , function (){
    //         console.log(startDate.toLocaleDateString() + " ok ");

    //     })

    //fetch(24 , startDate);

    aa.getTopError({ searchName: 'tickli', startDate: '2019-08-22' }, (data) => {
        console.log(data)
    });

});



