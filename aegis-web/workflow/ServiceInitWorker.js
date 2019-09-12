const log4js = require('log4js');
const logger = log4js.getLogger();
const path = require('path');
const { mkdirs } = require('../utils/mkdir');

module.exports = function () {
    setTimeout(function () {
        const LogService = require('../service/LogService');
        const logService = new LogService();
        logService.pushProject();

        require('../service/OfflineLogService')();
        mkdirs(path.join(__dirname, '../static/img/tmp'), (str) => {
            console.log(str || 'mkdir success');
        });
        mkdirs(path.join(__dirname, '../static/scoreimg'), (str) => {
            console.log(str || 'mkdir success');
        });
    }, 3000);
};
