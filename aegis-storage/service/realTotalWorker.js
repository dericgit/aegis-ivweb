/**
 * 内存中实时计算总数
 */

var fs = require('fs');
var path = require('path');

const crypto = require('crypto');

const log4js = require('log4js'),
    logger = log4js.getLogger();

const isDebug = process.env.debug == 'false' ? false : true;
const indexId = process.env.index;

if (isDebug) {
    logger.level = 'DEBUG';
}

const getYesterday = function () {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    return date;
};

const dateFormat = function (date, fmt) {
    const o = {
        'M+': date.getMonth() + 1, //月份
        'd+': date.getDate(), //日
        'h+': date.getHours(), //小时
        'm+': date.getMinutes(), //分
        's+': date.getSeconds(), //秒
        'q+': Math.floor((date.getMonth() + 3) / 3), //季度
        'S': date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    for (const k in o)
        if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    return fmt;
};

let saveData = {};
let currentCacheName = dateFormat(new Date, 'yyyy-MM-dd');


(function () {
    logger.info('[' + process.pid + '] worker of  realTotal ready ');

    const filePath = path.join(__dirname, '..', 'cache', 'total', currentCacheName + '_' + indexId);
    if (fs.existsSync(filePath)) {
        logger.info('[' + process.pid + ']: cache is exists , load it , path: ' + filePath);
        saveData = JSON.parse(fs.readFileSync(filePath));
    }
}());

/**
 * 获取错误数据
 * @param {*} totalData 
 * @param {*} startDate 
 * @param {*} endDate 
 */
const generateErrorMsgTop = function (totalData, startDate, endDate) {
    Object.keys(totalData).forEach(function (key, index) {
        if (key != 'total') {
            var fileName = dateFormat(new Date(startDate), 'yyyy-MM-dd') + '__' + key;
            var filePath = path.join(__dirname, '..', 'cache', 'errorMsg', fileName);
            var targetData = totalData[key];
            var errorMap = targetData.errorMap;
            var errorList = [];
            Object.keys(errorMap).forEach(function (errorMapKey) {
                errorList.push({ '_id': errorMap[errorMapKey].msg, 'total': errorMap[errorMapKey].total });
            });
            errorList.sort(function (a, b) {
                return a.total < b.total ? 1 : -1;
            });

            fs.writeFile(
                filePath,
                JSON.stringify({
                    'startDate': startDate,
                    'endDate': endDate,
                    'item': errorList.slice(0, 50),
                    'pv': targetData.total
                }),
                function (err) {
                    if (err) {
                        logger.error('[' + process.pid + ']: generated total cache error : ' + filePath);
                    } else {
                        logger.info('[' + process.pid + ']:generated total cache success : ' + filePath);
                    }
                }
            );
        }
    });
};

const flushCacheToDisk = function (resetCache, fileName) {
    const filePath = path.join(__dirname, '..', 'cache', 'total', fileName + '_' + indexId);
    const tickDate = Date.now();
    const content = JSON.stringify(saveData);
    logger.info('[' + process.pid + ']:stringify spend time : ' + (Date.now() - tickDate));

    if (resetCache) {
        const yesterday = getYesterday();
        generateErrorMsgTop(saveData, +yesterday, +yesterday + 86400000 - 1);
        saveData = {};
    }

    logger.info('[' + process.pid + ']flush cache to disk , path : ' + filePath);

    fs.writeFile(filePath, content, err => {
        if (err) {
            logger.error('[' + process.pid + ']: flush cache to disk error : ' + filePath);
        } else {
            logger.info('[' + process.pid + ']: flush cache to disk success : ' + filePath);
        }
    });
};


let tick = 0;
setInterval(function () {
    tick++;
    const newCacheName = dateFormat(new Date, 'yyyy-MM-dd');
    // not today , flush
    if (currentCacheName !== newCacheName) {
        flushCacheToDisk(true, currentCacheName);
        logger.info('[' + process.pid + ']reset cache  , currentName ' + currentCacheName + ', newCacheName ' + newCacheName);
        currentCacheName = newCacheName;
        tick = 0;
    } else if (tick >= 30) { // 每30把缓存中的数据写入文件
        flushCacheToDisk(false, currentCacheName);
        tick = 0;
    }

}, 60 * 1000);


function increase(id, data) {
    let md5 = '';
    try {
        md5 = crypto.createHash('md5').update(data.msg).digest('hex');
    } catch (e) {
        logger.error('md5 error : ' + e);
        return;
    }

    if (saveData['total'] == undefined) {
        saveData['total'] = 0;
    } else {
        ++saveData['total'];
    }

    if (saveData[id]) {
        saveData[id].total++;
    } else {
        saveData[id] = { total: 1, errorMap: {} };
    }

    let errorMap = saveData[id].errorMap;
    if (errorMap[md5]) {
        errorMap[md5].total++;
    } else {
        errorMap[md5] = { total: 1, msg: data.msg + '' };
    }

}

process.on('message', function (data) {
    if (data.type == 'write') {
        increase(data.id, data.data);
    }
});
