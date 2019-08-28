// 为 fastest 注册路由和处理请求函数

const path = require('path');
const api = require(global.apiPath);

/**
 * 创建项目
 * @param {*} req 
 * @param {*} res 
 */
async function createProject(req, res) {
    api.registApply(req.query).then(data => {
        res.json(data);
    }).catch(e => {
        res.json(e);
    });
}

/**
 * 添加白名单
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function addWhitelist(req, res, next) {
    const { aegis_id, creator, whitelist } = req.query;
    try {
        const whiteUsers = JSON.parse(whitelist);
        const users = whiteUsers.map(w => {
            return {
                aegisid: aegis_id,
                operator: creator,
                uin: w.uin,
                openid: w.open_id,
                remark: w.remark
            }
        });
        if (aegis_id && whiteUsers.length) {
            const data = await api.registAddWhitelist(users);
            res.json({
                retcode: 0,
                data
            });
        } else {
            throw new Error('params error')
        }
    } catch (e) {
        res.json(e);
    }
}

/**
 * 查询全部白名单
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function listWhitelis(req, res, next) {
    const { aegis_id } = req.query;
    try {
        const data = await api.registListWhitelist(aegis_id);
        res.json({
            retcode: 0,
            data
        });
    } catch (e) {
        res.json(e);
    }
}

/**
 * 删除白名单
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function deleteWhitelis(req, res, next) {
    const { aegis_id, uin, openid = '' } = req.query;
    try {
        const where = {
            aegisid: aegis_id,
            uin,
            // $or: [{ 'uin': uin }, { 'openid': openid }]
        }
        const data = await api.registDeleteWhitelist(where);
        res.json({
            retcode: 0,
            data
        });
    } catch (e) {
        res.json(e);
    }
}


module.exports = {
    route: [{
        path: 'fastest/createProject',
        handle: createProject
    }, {
        path: 'fastest/add',
        handle: addWhitelist
    }, {
        path: 'fastest/list',
        handle: listWhitelis
    }, {
        path: 'fastest/delete',
        handle: deleteWhitelis
    }]
};

