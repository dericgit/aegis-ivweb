const email = require('../mail');

const userList = ['tickli'];
const title = 'aegis 错误告警';
const subtitle = '每分钟单项目错误次数超过20次的时候，您会收到此报警，回复no拒收此邮件';

const content = [
    { 'type': 'h1', 'text': 'aegis 错误异常告警' },
    { 'type': 'p', 'text': '项目信息: ' },
    { 'type': 'p', 'text': 'owner: tickli' },
    { 'type': 'p', 'text': 'top error: ' },
    { 'type': 'line' }
];

const msgInfo = '您的项目出现错误异常，请打开企业邮件或者aegis页面查看详细内容\n如有疑问，欢迎联系aegis开发者'

email({ userList, title, subtitle, content, msgInfo });