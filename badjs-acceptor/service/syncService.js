/* global module */
/**
 * Created by chriscai on 2015/1/23.
 */

/**
 * TODO: project.db 体积会随着项目的增加逐渐膨胀，每次项目更新后全量持久化到文件 I/O 时间会线性增长；并且每次启动后全量加载项目数据到内存比较粗暴；
 * 可以考虑做 redis 缓存
 */

const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const log4js = require('log4js');
const logger = log4js.getLogger();

const path = require('path');

const dbPath = path.join(__dirname, '..', 'project.db');
const whitelistPath = path.join(__dirname, '..', 'whitelist.db');

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '{}', 'utf8');
}

if (!fs.existsSync(whitelistPath)) {
    fs.writeFileSync(whitelistPath, '{}', 'utf8');
}

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: 10 * 1024 * 1024
    })
);

const syncService = function(clusters) {
    const dispatchCluster = function(data) {
        for (var i = 0; i < clusters.length; i++) {
            clusters[i].send(data);
        }
    };

    // 主进程接收 projects 更新，然后通知 woker 进程更新
    app.use('/getProjects', function(req, res) {
        var param = req.query;
        if (req.method === 'POST') {
            param = req.body;
        }

        if (param.auth === 'badjsAcceptor' && param.projectsInfo) {
            dispatchCluster({
                projectsInfo: param.projectsInfo
            });

            fs.writeFile(dbPath, param.projectsInfo || '', function() {
                logger.info('update project.db');
            });
        }

        res.writeHead(200);
        res.end();
    })
        .use('/syncWhitelist', (req, res) => {
            if (req.method === 'POST') {
                const payload = req.body;
                if (payload.auth === 'badjsAcceptor' && payload.whitelist) {
                    dispatchCluster({
                        whitelist: payload.whitelist
                    });

                    fs.writeFile(whitelistPath, payload.whitelist, () => {
                        logger.info('update whitelist.db');
                    });
                }
            }
            res.status(200).end();
        })
        .listen(9001);

    const info = fs.readFileSync(dbPath, 'utf-8');
    const whitelist = fs.readFileSync(whitelistPath, 'utf-8');

    dispatchCluster({
        projectsInfo: info,
        whitelist
    });
};

module.exports = syncService;
