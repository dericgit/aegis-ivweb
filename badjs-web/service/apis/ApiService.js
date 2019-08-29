'use strict';
const Promise = require('bluebird');

const userService = require('../UserService.js');
const crypto = require('crypto');
const logger = require('log4js').getLogger();
const ApplyService = require('../ApplyService.js');
const WhitelistService = require('../WhitelistService');

function _getUserByName(name) {

    const db = global.models.db;

    return new Promise((resolve, reject) => {
        if (!/^\w+$/.test(name)) {
            reject('name error.');
            return;
        }

        let sql = `select id, loginName, chineseName, role, email, verify_state from b_user where loginName='${name}'`,
            userObj;

        db.driver.execQuery(sql, (err, data) => {
            if (err) {
                logger.error(err);
                reject(err);
            } else {
                if (data.length > 0) {
                    userObj = data[0];
                    if (userObj.verify_state !== 2) {
                        reject({ retcode: 1, msg: 'waiting for admin verify' });
                    }
                    resolve({
                        userId: userObj.id,
                        name: userObj.loginName,
                        role: userObj.role,
                        email: userObj.email
                    });
                } else {
                    reject({ retcode: 1, msg: 'user not found' });

                }
            }
        });
    });
}


function getUser(name) {
    return _getUserByName(name);
}

function _addApply(apply) {
    return new Promise((resolve, reject) => {
        new ApplyService().add(apply, (err, item) => {
            if (err) {

                reject({ retcode: 1, msg: err });
            } else {
                resolve({ retcode: 0, badjsId: item.applyId });
            }
        });
    });
}

/**
 * applyObj
 */
function registApply(applyObj) {

    if (!applyObj.applyName || !applyObj.url) {
        return Promise.reject({ retcode: 2, msg: 'params error. ' });
    }

    var apply = {
        userName: applyObj.userName,
        status: applyObj.applyStatus || 0,
        name: applyObj.applyName,
        appkey: crypto.createHash("md5").update(new Date - 0 + "badjsappkey" + applyObj.userName).digest('hex'),
        url: applyObj.url,
        blacklist: applyObj.blacklist || '{"ip":[],"ua":[]}',
        description: applyObj.description,
        mail: '',
        createTime: new Date(),
        passTime: new Date(),
        online: 1,
        limitpv: 0,
        codePath: applyObj.codePath
    };

    return getUser(apply.userName).then(data => {
        apply.user = { id: data.userId };
        return _addApply(apply);
    }).catch(e => {
        return e;
    });
}

async function registAddWhitelist(users) {
    return await WhitelistService.addBulkUser(users);
}

async function registListWhitelist(aegis_id) {
    const data = await WhitelistService.findBatchUsers({
        where: {
            aegisid: aegis_id
        },
        order: [['id', 'DESC']],
        limit: 2000
    });
    return data;
}

async function registDeleteWhitelist (where) {
    return await WhitelistService.deleteUsersByConditions(where)
}

module.exports = {
    getUser,
    registApply,
    registAddWhitelist,
    registListWhitelist,
    registDeleteWhitelist
};
