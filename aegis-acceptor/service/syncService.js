/**
 * 项目信息以及白名单信息同步操作
 * 在项目初始化的时候会自动从DB里面读写相关信息，并且放在内存中
 * 项目中如果有apply信息改变，或者白名单信息更新，会重新触发读取操作
 */
const log4js = require('log4js');
const express = require('express');
const Sequelize = require('sequelize');
const logger = log4js.getLogger();

const sequelize = new Sequelize(global.pjconfig.mysql.url);

const app = express();

const syncService = function (clusters) {
    const dispatchCluster = function (data) {
        for (let i = 0; i < clusters.length; i++) {
            clusters[i].send(data);
        }
    };

    const initeWhiteList = async function () {
        const whitelist = await sequelize.query('select uin, aid, aegisid from b_whitelist where aegisid = 0 or aegisid in (select id from b_apply  where status = 1)');
        if (whitelist && whitelist.length && whitelist[0].length) {
            const whitelistInfo = whitelist[0].reduce((p, c) => {
                if (!p[c.aegisid]) {
                    p[c.aegisid] = {};
                }
                p[c.aegisid][c.uin] = 1;
                return p;
            }, {});
            dispatchCluster({
                whitelistInfo
            });
        } 
    }

    const initProject = async function () {
        try {
            const projects = await sequelize.query('select id, username, name, url from b_apply where status = 1');
            if (projects && projects.length && projects[0].length) {
                const projectsInfo = projects[0].reduce((p, c) => {
                    p[c.id] = {
                        id: c.id,
                        url: c.url,
                        user: c.username,
                        name: c.name
                    };
                    return p;
                }, {});
                dispatchCluster({
                    projectsInfo
                });
            }
     
        } catch (e) {
            logger.warn(e);
        }
    }

    initProject();
    initeWhiteList();

    // 主进程接收 projects 更新，然后通知 woker 进程更新
    app.use('/pushProject', function (req, res) {
        logger.info('project update at ' + new Date());
        initProject();
        res.writeHead(200);
        res.end();
    }).use('/syncWhitelist', (req, res) => {
        logger.info('whitelist update at ' + new Date());
        initeWhiteList();
        res.status(200).end();
    })
        .listen(9001);
};

module.exports = syncService;
