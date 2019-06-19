const _ = require('lodash');
const hub = require('clusterhub');
const log4js = require('log4js');
const logger = log4js.getLogger();

const { quantityLimitNotify } = require('../service');

const WORKERS_NUM = 4;
const QUANTITY_LIMIT = 100000;
let reportRecord = {};

// 在多个 worker 进程中共享 reportRecord 的 notify flag，实现只在一个 worker 中发送告警
// 在同一个项目并发上报的情况下，会出现重复告警的情况，因为 notify flag 在 woker 间同步完成之前，并发的上报已经执行过了判断 notify flag 的代码
hub.on('UPDATE_REPORT_RECORD', data => {
    // 在 worker 间同步 notify flag
    _.merge(reportRecord, data);
});

const endDate = new Date();
// 当前下一个整点
endDate.setHours(endDate.getHours(), 60, 0, 0);

// 每隔1小时（整点）清理上报记录
const CLEAR_INTERVAL = 60 * 60 * 1000;
const runIntervalClear = function() {
    setInterval(function() {
        logger.info(`[${process.pid}] clear report records.`);
        reportRecord = {};
    }, CLEAR_INTERVAL);
};

logger.info('after ' + (endDate - new Date()) + ' run limit monitor clear');
setTimeout(function() {
    runIntervalClear();
}, endDate - new Date());

/**
 * Created by chriscai, 为后面的服务减少压力
 * 限制进程每个小时最大上报 200000
 */
module.exports = function() {
    return {
        process: function(data) {
            const arr = data.data;
            const id = arr ? arr[0].id : null;
            if (!id) {
                return false;
            }

            let total = 0;
            if (!reportRecord[id]) {
                reportRecord[id] = {};
                total = reportRecord[id].count = arr.length;
            } else {
                reportRecord[id].count += arr.length;
                total = reportRecord[id].count;
            }

            // 超过阈值后，告警一次，并且丢弃上报
            if (total >= QUANTITY_LIMIT) {
                if (!reportRecord[id].hasNotify) {
                    logger.info(`[${process.pid}] id ${id} total is exceed ${QUANTITY_LIMIT}`);
                    // 忽略通知结果，默认成功；并且提示数量乘以进程数量倍数（近似值，某个项目的上报并不是轮流发到每个 woker）
                    quantityLimitNotify(id, QUANTITY_LIMIT * WORKERS_NUM, false);
                    reportRecord[id].hasNotify = true;
                    // 向其它 worker 同步 notify flag
                    hub.emitRemote('UPDATE_REPORT_RECORD', { [id]: { hasNotify: true } });
                }
                return false;
            }

            // 超过一半阈值后，提示一次异常
            if (total >= QUANTITY_LIMIT / 2) {
                if (!reportRecord[id].hasHalfNotify) {
                    logger.info(`[${process.pid}] id ${id} total is exceed ${QUANTITY_LIMIT / 2}`);
                    quantityLimitNotify(id, QUANTITY_LIMIT * WORKERS_NUM, true);
                    reportRecord[id].hasHalfNotify = true;
                    hub.emitRemote('UPDATE_REPORT_RECORD', { [id]: { hasHalfNotify: true } });
                }
            }
        }
    };
};
