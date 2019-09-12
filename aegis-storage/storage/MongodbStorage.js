const mongoose = require('mongoose');
const log4js = require('log4js');
const logger = log4js.getLogger();
const monitor = require('../service/monitor');
const map = require('map-stream');
const realTotal = require('../service/realTotalMaster');

const connection = mongoose.createConnection(global.MONGODB.url, {
    auth: {
        authSource: 'admin'
    },
    useCreateIndex: true,
    useNewUrlParser: true
});

const schemaObj = {
    msg: String,
    ext: String,
    level: Number,
    from: String,
    version: String,
    uin: { type: String, index: true },
    aid: { type: String, index: true },
    ip: String,
    userAgent: String,
    date: Number
}

// 每个 collection 最大一千万条数据，占有空间最大 20G
const LogSchema = new mongoose.Schema(Object.assign({ all: String }, schemaObj),
    { capped: { size: 21474836480, max: 10000000, autoIndexId: true } });

LogSchema.index({ date: -1, level: 1 });

connection.on('error', console.error.bind(console, 'connection error 😢:'));
connection.once('open', function () {
    console.log('connect to mongodb, 😊');
    connection.db.listCollections().toArray(function (err, collections) {
        if (err) {
            console.log(err);
        } else {
            // 单例初始化
            collections.forEach(element => {
                console.log(element.name);
            });
        }
    });
});

const modelMap = {};

function initModel(collectionName) {
    if (!modelMap[collectionName]) {
        modelMap[collectionName] = connection.model(collectionName, LogSchema);
    }
    return modelMap[collectionName];
}

const insertDocuments = function (id, data) {
    const collectionName = 'badjslog_' + id;
    const model = initModel(collectionName);
    try {
        model.create(data);
    } catch (e) {
        monitor(34471884); // [ivweb-aegis] mongodb插入失败
        logger.warn('aegis-storage insert documents err' + e);
    }
};

module.exports = function () {
    return map(function (data) {
        const dataStr = data.toString();
        try {
            data = JSON.parse(dataStr.substring(dataStr.indexOf(' ')));
        } catch (e) {
            logger.error('parse error');
            return;
        }

        if (data.level != 4 && data.level != 2) {
            return;
        }

        if (!data.id) {
            logger.info('not id data');
            return;
        }
        const id = data.id;
        delete data.id;

        let all = '';
        for (const key in data) {
            if (key in schemaObj) {
                all += ';' + key + '=' + data[key];
            }
        }
        data.all = all;

        insertDocuments(id, data);

        if (data.level == 4) {
            realTotal.increase(id, data);
        }

    });
};