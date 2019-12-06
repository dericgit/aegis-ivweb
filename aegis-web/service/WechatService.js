const moment = require('moment');
const orm = require('orm');
const cp = require('child_process');
const request = require('request');
const pjConfig = require('../project.json');
const getScore = require('../lib/getScore.js');

const mysqlUrl = pjConfig.mysql.url;

var mdb = orm.connect(mysqlUrl, function (err, db) {

    const yesterday = moment().subtract(1, 'day').format('YYYYMMDD') - 0;
    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${pjConfig.wechat}`;

    const sql = 'select s.*, a.userName, a.name from b_quality as s, b_apply as a where s.badjsid=a.id and a.status=1 and a.online=2 and s.pv>a.limitpv and s.rate > 0.5 and s.date=' + yesterday + ' order by s.rate + 0 desc limit 25;';
    db.driver.execQuery(sql, (err, data) => {
        mdb.close();

        if (!data.length) return;

        const mentioned_list = [];

        const base = `#### Aegis昨日统计扣分项目共<font color=\"warning\"> ${data.length} </font>例。\n \n`;

        const msg = base + data.map(d => {
            if (mentioned_list.indexOf(d.userName) === -1) {
                mentioned_list.push(d.userName);
            }
            const score = getScore.handleScore(d.pv, d.badjscount);
            return `> ${d.badjsid}-${d.name} - ${d.userName} - (pv: ${d.pv}; count: ${d.badjscount}; 得分：<font color="info">${score}</font>)`;
        }).join('\n') +
        `\n \n #### 查看 [Aegis](https://aegis.ivweb.io/#/project-daily-statics) 定位问题。`;

        const options = {
            url,
            method: 'POST',
            json: {
                'msgtype': 'markdown',
                'markdown': {
                    'content': msg
                }
            }
        };

        const options2 = {
            url,
            method: 'POST',
            json: {
                'msgtype': 'text',
                'text': {
                    content: '请相关同事注意。',
                    mentioned_list
                }
            }
        };

        request(options, function (err, res, body) {
            if (!err) {
                request(options2, function (err, res, body) {
                    console.log(body);
                });
            }
        });
    });
});

