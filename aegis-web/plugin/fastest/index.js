// 为 fastest 注册路由和处理请求函数

const api = require(global.apiPath);

/**
 * 创建项目
 * @param {*} req 
 * @param {*} res 
 */
async function createProject(req, res) {
    const appyObj = req.query;
    appyObj.applyStatus = 1;
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
    api.registListWhitelist(aegis_id, data => {
        return res.json({
            retcode: 0,
            data
        });
    });
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


/**
 * 更新项目状态
 * { aegis_id, status }
 * 0 待审核
 * 1 通过
 * 2 拒绝
 * @param {*} param
 */
async function changeProjectStatus(req, res, next) {
    const { aegis_id, status } = req.query;
    console.log(aegis_id, status);
    return api.registProjectStatusUpdate({ aegis_id, status }).then(data => {
        res.json(data);
    }).catch(e => {
        res.json(e);
    });
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
    }, {
        path: 'fastest/changeProjectStatus',
        handle: changeProjectStatus
    }]
};

