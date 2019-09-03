
// 黑名单配置
const blacklistIP = global.pjconfig['blackList'] ? global.pjconfig['blackList'].ip : [];
const blacklistUA = global.pjconfig['blackList'] ? global.pjconfig['blackList'].ua : [];

// ip黑名单正则
const blacklistIPRegExpList = [];
(blacklistIP || []).forEach(function (reg) {
    blacklistIPRegExpList.push(new RegExp('^' + reg.replace(/\./g, '\\.')));
});

// ua黑名单正则
const blacklistUARegExpList = [];
(blacklistUA || []).forEach(function (reg) {
    blacklistUARegExpList.push(new RegExp(reg, 'i'));
});

/**
 * 判断是否在黑名单里
 * 黑名单列表支持正则表达式
 * @param ip 请求的ip
 * @return {boolean} 是否在黑名单里
 */
function inBlacklist (ip, regExpList) {
    for (let i = 0; i < regExpList.length; i++) {
        if (regExpList[i].test(ip)) {
            return true;
        }
    }
    return false;
}

/**
 * Created by halwu
 * IP黑名单过滤
 */
module.exports = function () {
    return {
        process: function (data) {
            const arr = data.data;
            for (let i = 0; i < arr.length; i++) {
                const ip = arr[i].ip;
                const ua = arr[i].userAgent;
                if (inBlacklist(ip, blacklistIPRegExpList)) {
                    console.log('ignore request ,  in Blacklist by Ip:' + ip);
                    data.req.throwError = 'global_blackList_ip';
                    return false;
                }
                if (inBlacklist(ua, blacklistUARegExpList)) {
                    console.log('ignore request ,forbidden in Blacklist by userAgent :' + ua);
                    data.req.throwError = 'global_blackList_ua';
                    return false;
                }
            }
        }
    };
};
