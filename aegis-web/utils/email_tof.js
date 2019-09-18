const axios = require('axios');
const log4js = require('log4js');
const logger = log4js.getLogger();

module.exports = function ({userList=['tickli'], title, subtitle, content, msgInfo}) {
    axios.post('http://100.66.102.76/sendTof', {
        'rtx': 1,
        'email': 1,
        'wechat': 1,
        'to': userList,
        'title': title,
        'subtitle': subtitle,
        'content': content,
        'priority': 0,
        'msgInfo': msgInfo
    }).then(res => {
        console.log(res.data);
        logger.info(res.data);
    }).catch(e=> {
        logger.warn('send eamil error');
        logger.warn(e);
    })
}