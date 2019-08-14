const request = require('request');
const moment = require('moment');
const mail = require('../utils/ivwebMail_for_single.js');

let INTERVAL = 10; // 分钟
let EMAIL_INTERVAL = 60; // 分钟
let emailMap = {};

const formatDate = function (str) {
    return moment(str).format('YYYY-MM-DD hh:mm');
}

const constructEmail = function (items) {
    const html = ['<html><body>'];
    items.forEach(item => {
        html.push(`<h3>${items}</h3><br>`);
    });

    html.push('</body></html>');
    return html.join('');
}

module.exports = function () {
    setTimeout(() => {
        const LogService = require('../service/LogService');
        const UserService = require('../service/UserService');
        const logService = new LogService();
        const userService = new UserService();

        const { wechat_ping, ping = [] } = global.pjconfig;
        const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${wechat_ping}`;

        const job = function () {
            ping.forEach((id) => {
                const endDate = +new Date() - INTERVAL * 60 * 1000;
                const startDate = endDate - INTERVAL * 60 * 1000;

                logService.query({ id, startDate, endDate, 'level[]': 2, _t: +new Date() }, function (err, items) {
                    console.log(`${formatDate(new Date())} ping 检测, id: ${id}, 检测插入数据${items.length}条`);
                    if (!items.length) {
                        userService.queryMailByApplyId(id, function (err, data) {
                            const email = data[0].email;
                            const loginName = data[0].loginName;
                            const msg = `Aegis数据上报异常 - 检测到 aegis id: ${id} (owner: ${loginName}) 从 ${formatDate(startDate)} 到 ${formatDate(endDate)} 没有数据上报，服务或者项目可能存在异常，请及时检查`;
                            emailMap[id] = {
                                email,
                                msg
                            };
                            request({
                                url,
                                method: 'POST',
                                json: {
                                    'msgtype': 'text',
                                    'text': {
                                        content: msg,
                                        mentioned_list: [loginName]
                                    }
                                }
                            }, () => {});
                        });
                    }
                });
            });
        };
        // ping 逻辑
        setInterval(job, INTERVAL * 60 * 1000);

        setInterval(() => {
            let { errorMailTo } = global.pjconfig;
            let msgs = [];
            // for (let k in emailMap) {
            //     let v = emailMap[k];
            //     if (!errorMailTo.includes(v.email)) {
            //         errorMailTo += `,${v.email}`;
            //     }
            //     msgs.push(v.msg);
            // }
            console.log('send aegis ping error mail to: ', errorMailTo);
            if (msgs.length) {
                const html = constructEmail(msgs);
                mail('', errorMailTo, '', 'Aegis数据上报异常', html, '', true);
            }
            emailMap = {};
        }, EMAIL_INTERVAL * 60 * 1000);
    }, 3000);
};

