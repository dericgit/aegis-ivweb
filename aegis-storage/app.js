var log4js = require('log4js'),
    logger = log4js.getLogger();

var path = require("path");
var argv = process.argv.slice(2);

if (argv.indexOf('--project') >= 0) {
    global.pjconfig = require(path.join(__dirname, 'project.debug.json'));
} else {
    global.pjconfig = require(path.join(__dirname, 'project.json'));
}

if (argv.indexOf('--debug') >= 0) {
    logger.level = 'DEBUG';
    global.debug = true;
} else {
    logger.level = 'INFO';
}

global.MONGODB = global.pjconfig.mongodb;

var dispatcher = require('./acceptor');
var save = require('./storage/MongodbStorage');
var pos = require('./cache/pos');
// 创建所需目录
pos();

// use zmq to dispatch
dispatcher()
    .pipe(save());

logger.info('start aegis-storage success.');

setTimeout(function () {
    require('./service/query')();
    require('./service/autoClear')();
}, 1000);
