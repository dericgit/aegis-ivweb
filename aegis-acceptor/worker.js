'use strict';
const fs = require('fs');
const http = require('http');

const express = require('express');
const bodyParser = require('body-parser');
const multipart = require('connect-multiparty');
const interceptor = require('c-interceptor')();
const log4js = require('log4js');
const logger = log4js.getLogger();
const path = require('path');

const monitor = require('./monitor');

/* -------------------------------------------------------------------------- */
/*                                    init                                    */
/* -------------------------------------------------------------------------- */

const app = express();

const REG_REFERER = /^https?:\/\/[^\/]+\//i;
const REG_DOMAIN = /^(?:https?:)?(?:\/\/)?([^\/]+\.[^\/]+)\/?/i;

const deflateObj = {
    f: 'from',
    l: 'level',
    m: 'msg',
    t: 'time',
    v: 'version'
};

const forbiddenData = '403 forbidden';

const responseHeader = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
    Connection: 'close'
};

global.projectsInfo = {};
// listen for projects and whitelist update from master
process.on('message', function(data) {
    if (data.projectsInfo) {
        let info = data.projectsInfo;
        if (typeof info === 'object') {
            for (const k in info) {
                const v = info[k] || {};
                v.domain = get_domain(v.url);
            }
            global.projectsInfo = info;
        }
    }
    if (data.whitelist) {
        global.whitelist = data.whitelist;
    }
});

/* -------------------------------------------------------------------------- */
/*                                 middlewares                                */
/* -------------------------------------------------------------------------- */

const multipartMiddleware = multipart({
    maxFilesSize: 10 * 10 * 1024
});

const logErrors = (err, req, res, next) => {
    console.log('=========================');
    console.error(err);
    console.log(req.get('User-Agent'));
    console.log('=========================');
    res.status(500);
    res.json({ error: 'json parser error' });
    return;
};

app.use(multipartMiddleware);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: 10 * 1024 * 1024
    })
);

app.use((req, res, next) => {
    // 过滤安全扫描
    let ua = req.get('User-Agent') || '';
    if (ua.indexOf('TST(Tencent_Security_Team)') > -1) {
        console.log('tencent sercurity');
        monitor('34464214');
        return res.json({
            retcode: 0,
            msg: 'succ'
        });
    } else {
        next();
    }
});
app.use(logErrors);

/* -------------------------------------------------------------------------- */
/*                                interceptors                                */
/* -------------------------------------------------------------------------- */

const interceptors = global.pjconfig.interceptors;

interceptors.forEach(function(value, key) {
    var one = require(value)();
    interceptor.add(one);
});
interceptor.add(require('./dispatcher')());

/* -------------------------------------------------------------------------- */
/*                              helper functions                              */
/* -------------------------------------------------------------------------- */

const get_domain = function(url) {
    return (url.toString().match(REG_DOMAIN) || ['', ''])[1].replace(/^\*\./, '');
};

function getClientIp(req) {
    try {
        const xff = (req.headers['X-Forwarded-For'] || req.headers['x-forwarded-for'] || '')
            .split(',')[0]
            .trim();

        return (
            xff ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress
        );
    } catch (ex) {}

    return '0.0.0.0';
}

function writeOfflineLog(offline_log) {
    const logs = offline_log.logs;
    const msgObj = offline_log.msgObj;
    const urlObj = offline_log.urlObj;

    if (!logs || !logs.length) {
        return false;
    }

    const filePath = path.join(global.pjconfig.offline.path, offline_log.id + '');

    const fileName = offline_log.uin + '_' + offline_log.startDate + '_' + offline_log.endDate;

    if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath);
    }

    logs.map(function(log) {
        if (msgObj) {
            log.m = msgObj[log.m];
        }
        if (urlObj) {
            log.f = urlObj[log.f];
        }
        for (const k in deflateObj) {
            if (k in log) {
                const v = deflateObj[k];
                log[v] = log[k];
                delete log[k];
            }
        }
        return log;
    });

    fs.writeFile(path.join(filePath, fileName), JSON.stringify(offline_log), function(err) {
        if (!err) {
            console.log('write offline log success');
        }
    });
}

/**
 * 校验来源的url 是否和填写的url相同
 * @param id
 * @param req
 * @returns {boolean}
 */
const referer_match = function(id, req) {
    const referer = (((req || {}).headers || {}).referer || '').toString();

    const projectMatchDomain = (global.projectsInfo[id.toString()] || {}).domain;
    // no referer
    if (!referer) {
        // match match is * , no detect referer
        if (!projectMatchDomain) {
            return true;
        }
        return false;
    }
    const domain = (referer.match(REG_REFERER) || [''])[0] || '';
    return typeof global.projectsInfo === 'object' && domain.indexOf(projectMatchDomain) !== -1;
};

function badRequest(res) {
    responseHeader['Content-length'] = forbiddenData.length;
    res.writeHead(403, responseHeader);
    res.write(forbiddenData);
    res.end('');
}

function checkReportID(id, req) {
    if (isNaN(id) || id <= 0 || id >= 9999) {
        logger.warn('bad request:', id, '无效的id参数');
        return false;
    } else if (!global.projectsInfo[id]) {
        logger.warn('bad request:', id, '没有找到对应的项目信息');
        return false;
    } else if (!referer_match(id, req)) {
        logger.warn('bad request:', id, 'referer 跟登记的不一致');
        return false;
    }
    return [true];
}

function checkWhitelist(req, res) {
    let params = req.query;
    const id = params.id - 0;
    const uin = params.uin;
    const projectOnly = params.projectOnly; // 只检测当前项目是否白名单

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.send(200);

    if (!id || !uin || !global.whitelist || Object.keys(global.whitelist).length === 0) {
        responseHeader['Content-length'] = 0;
        res.writeHead(204, responseHeader);
        res.end();
        return;
    }

    const pass = checkReportID(id, req);
    if (!pass) {
        return badRequest(res);
    }

    let is_in_white_list = false;
    if (!projectOnly && global.whitelist[0]) {
        is_in_white_list = !!global.whitelist[0][uin]; 
    }
    if (!is_in_white_list && global.whitelist[id]) {
        is_in_white_list = !!global.whitelist[id][uin];
    }

    return res.status(200).json({
        retcode: 0,
        result: {
            is_in_white_list
        }
    });
}

/* -------------------------------------------------------------------------- */
/*                                   routes                                   */
/* -------------------------------------------------------------------------- */

/* ---------------------------------- 离线日志 ---------------------------------- */
app.use('/badjs/offlineLog', function(req, res) {
    // 大于 10ms , forbidden
    if (parseInt(req.headers['content-length']) > 10485760) {
        return res.end('logs too large');
    }

    let offline_log = req.body.offline_log;

    if (typeof offline_log === 'string') {
        try {
            offline_log = JSON.parse(offline_log);
        } catch (e) {
            return res.end('offline log error');
        }
    }

    if (!offline_log) {
        return res.end('error');
    }

    if (!/^[0-9]{1,5}$/.test(offline_log.id)) {
        return res.end('invalid id');
    }

    if (!/^\w{4,40}$/.test(offline_log.uin)) {
        return res.end('invalid uin');
    }

    // secretKey 校验
    http.get(
        global.pjconfig.offline.offlineLogCheck +
            '?delete=1&id=' +
            offline_log.id +
            '&uin=' +
            offline_log.uin,
        function(clientRes) {
            var result = '';
            clientRes.setEncoding('utf8');
            clientRes.on('data', function(chunk) {
                result += chunk;
            });

            clientRes.on('end', function() {
                if (result && result == offline_log.secretKey) {
                    writeOfflineLog(offline_log);
                    return res.end('ok');
                }
                return res.end('invalid secretKey');
            });
        }
    ).on('error', function(e) {
        return res.end('false');
    });
})
    .use('/badjs/offlineAuto', function(req, res) {
        const param = req.query;
        http.get(
            global.pjconfig.offline.offlineLogCheck + '?id=' + param.id + '&uin=' + param.uin,
            function(clientRes) {
                var result = '';
                clientRes.setEncoding('utf8');
                clientRes.on('data', function(chunk) {
                    result += chunk;
                });

                clientRes.on('end', function() {
                    if (result) {
                        return res.end(
                            "window && window._badjsOfflineAuto && window._badjsOfflineAuto('" +
                                result +
                                "');"
                        );
                    }
                    res.end('false');
                });
            }
        ).on('error', function(e) {
            logger.warn('offlineLogCheck err , ', e);
            res.end('window && window._badjsOfflineAuto && window._badjsOfflineAuto(false);');
        });
    })
    .use('/badjs/mpOfflineAuto', function(req, res) {
        const param = req.query;

        http.get(
            global.pjconfig.offline.offlineLogCheck + '?id=' + param.id + '&uin=' + param.uin,
            function(clientRes) {
                let result = '';
                clientRes.setEncoding('utf8');
                clientRes.on('data', function(chunk) {
                    result += chunk;
                });

                clientRes.on('end', function() {
                    return res.end(
                        JSON.stringify({
                            code: 200,
                            msg: result ? result : false
                        })
                    );
                });
            }
        ).on('error', function(e) {
            logger.warn('offlineLogCheck err , ', e);
            return res.end(
                JSON.stringify({
                    coo: 500,
                    error: e
                })
            );
        });
    })
    /* --------------------------------- 是否白名单用户 -------------------------------- */
    .use('/aegis/whitelist', checkWhitelist)
    /* ---------------------------------- 日志上报 ---------------------------------- */
    .use('/badjs', function(req, res) {
        let param = req.query || {};
        if (req.method === 'POST' && req.body && typeof req.body.id !== 'undefined') {
            param = req.body || {};
        }

        const id = param.id - 0;

        const pass = checkReportID(id, req);
        if (!pass) {
            return badRequest(res);
        }

        param.id = id;

        try {
            interceptor.invoke({
                req: req,
                data: param
            });
        } catch (err) {
            return badRequest(res);
        }

        if (req.throwError) {
            return badRequest(res);
        }

        // responseHeader end with 204
        responseHeader['Content-length'] = 0;
        res.writeHead(204, responseHeader);
        res.end();
    })

    // master 进程监听 port 端口，轮流分发给 4 个 worker 进程处理连接
    .listen(global.pjconfig.port, () => {
        logger.info(
            `[worker ${process.pid}] start badjs-accepter , listen ${global.pjconfig.port} ...`
        );
    });
