/**
 * 内存中实时计算总数
 */

const path = require("path");

const log4js = require('log4js'),
    logger = log4js.getLogger();

const cluster = require('cluster');
cluster.setupMaster({
    exec: path.join(__dirname, "realTotalWorker.js")
});

const clusterPool = [];

for (let i = 0; i < global.pjconfig.realTotal; i++) {
    clusterPool.push(cluster.fork({ index: i, debug: !!global.debug }));
}

module.exports = {
    increase: function (id, data) {
        const index = id % clusterPool.length;
        const targetCluster = clusterPool[index];
        targetCluster.send({ id: id, data: data, type: "write" });
    },
};
