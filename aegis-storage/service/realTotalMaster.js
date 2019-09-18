/**
 * 内存中实时计算总数
 */

const path = require("path");
const mail = require('../mail');
const log4js = require('log4js');
const logger = log4js.getLogger();

const cluster = require('cluster');
cluster.setupMaster({
    exec: path.join(__dirname, "realTotalWorker.js")
});

const clusterPool = [];

for (let i = 0; i < global.pjconfig.realTotal; i++) {
    clusterPool.push(cluster.fork({ index: i, debug: !!global.debug }));
}

let errorMap = {};

const userList = ['tickli', 'adamhe', 'pumpkincai'];
const title = 'aegis 错误告警';
const subtitle = '每分钟单项目错误次数超过20次的时候，您会收到此报警，回复no拒收此邮件';

const msgInfo = '您的项目出现错误异常，请打开企业邮件或者aegis页面查看详细内容\n如有疑问，欢迎联系aegis开发者'

setInterval(() => {
    errorMap = {};
}, 60 * 1000);

const checkMail = function (id) {
    if (!errorMap[id]) {
        errorMap[id] = 1;
    } else {
        errorMap[id] += 1;
    }
    if (errorMap[id] === 20) {
        const content = [
            { 'type': 'h1', 'text': 'aegis 错误异常告警' },
            { 'type': 'p', 'text': '项目id: ' + id },
            { 'type': 'p', 'text': 'owner: tickli' },
            { 'type': 'p', 'text': 'top error: ' },
            { 'type': 'line' }
        ];
        mail({ userList, title, subtitle, content, msgInfo });
    }
}

module.exports = {
    increase: function (id, data) {
        checkMail(id);
        const index = id % clusterPool.length;
        const targetCluster = clusterPool[index];
        targetCluster.send({ id: id, data: data, type: "write" });
    },
};
