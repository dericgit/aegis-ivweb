const Sequelize = require('sequelize');
const logger = require('log4js').getLogger();
const whitelistService = require('../../service/WhitelistService');

const ROLE = {
    ADMIN: 1
};

function responseError(res, error, fallbackMsg) {
    let errMsg = fallbackMsg;
    if (error) {
        if (typeof error === 'string') {
            errMsg = error;
        } else if (error.message) {
            errMsg = error.message;
        }
    }
    res.status(500).json({
        ret: 1000,
        msg: errMsg
    });
}

function responseParamError(res, msg, ret = 1002) {
    res.status(400).json({
        ret,
        msg
    });
}

function checkUin(res, uin) {
    if (uin) return true;

    responseParamError(res, 'uin为空');
    return false;
}

async function syncAndResponse(res) {
    try {
        // todo:
        // await whitelistService.postToAcceptor();
        res.status(200).json({
            ret: 0,
            msg: 'success'
        });
    } catch (error) {
        logger.error('Post whitelist to acceptor fail!', error);
        res.json({ ret: 1004, msg: `同步白名单到 Acceptor 失败 ${error}` });
    }
}

function assembleWhere(conditions) {
    const where = {};
    const exactConditions = ['operator', 'uid', 'aid', 'id', 'aegisid'];
    const blurConditions = ['remark', 'openid', 'uin'];
    exactConditions.forEach(con => {
        if (conditions[con]) {
            where[con] = conditions[con];
        }
    })
    blurConditions.forEach(con => {
        if (conditions[con]) {
            where[con] = {
                [Sequelize.Op.like]: `%${conditions[con]}%`
            };
        }
    })

    return where;
}

module.exports = {
    async addUser(payload, req, res) {
        const { uin, aegisid, openid } = payload;

        // uin和openid至少有一个不为空
        if ((!uin && !openid) || (typeof aegisid !== 'string' && typeof aegisid !== 'number')) {
            return res.status(200).json({
                ret: 1002,
                msg: '参数错误'
            });
        }
        // todo:
        // if (!checkUin(res, uin)) return;
        // const { loginName: operator } = req.session.user;
        const { loginName: operator } = { loginName: 'duanyuanping' };

        try {
            const [, isCreated] = await whitelistService.addUser({
                operator,
                ...payload
            });
            if (!isCreated) {
                return res.status(200).json({
                    ret: 1003,
                    msg: `记录${JSON.stringify({ uin, openid, aegisid })}已经存在！`
                });
            }
            syncAndResponse(res);
        } catch (error) {
            responseError(res, error, '添加白名单用户失败');
            logger.error(
                'Add whitelist user fail! uin: [%d], operator: [%s], error: %o',
                uin,
                operator,
                error
            );
        }
    },

    async deleteUser(payload, req, res) {
        const { id } = payload;

        if (!id) {
            return res.status(200).json({
                ret: 1002,
                msg: '参数错误'
            })
        }

        // todo:
        // const { loginName, role } = req.session.user;
        const { loginName, role } = { loginName: 'duanyuanping', role: 1 };

        try {
            const targetUser = await whitelistService.findBatchUsers({
                where: {
                    id: id
                }
            });
            if (!targetUser.count) {
                logger.warn('Does not exist whitelist user: [%d]!', id);
                return res.status(500).json({ ret: 1005, msg: `不存在该白名单用户 ${id}` });
            }
            let cantDel = false;
            for (const data of targetUser.rows) {
                if (role !== ROLE.ADMIN && data.operator !== loginName) {
                    cantDel = true;
                    break;
                }
            }
            // 非管理员只能删除自己添加的白名单用户
            if (cantDel) {
                logger.error(
                    'Non-administrators can only delete whiteliste users they have added! id: [%d], operator: [%s], role: [%d]',
                    id,
                    loginName,
                    role
                );
                return res
                    .status(403)
                    .json({ ret: 1006, msg: '非管理员只能删除自己添加的白名单用户' });
            }

            const deletedRows = await whitelistService.deleteUser(id);
            if (deletedRows < 1) {
                throw new Error(null);
            }

            syncAndResponse(res);
        } catch (error) {
            responseError(res, error, '删除白名单用户失败');
            logger.error(
                'Delete whitelist user fail! id: [%d], operator: [%s]',
                id,
                loginName,
                error
            );
        }
    },

    async getUsers(payload, req, res) {
        const findWhere = assembleWhere(payload);
        const { offset = 0, limit = 20 } = payload;
        let { sort = { key: 'updated_at', order: 'descend' } } = payload;
        sort = typeof sort === 'string' ? JSON.parse(sort) : sort;
        try {
            const findResults = await whitelistService.findBatchUsers({
                where: findWhere,
                order: [typeof sort === 'object' ? [`${sort.key}`, `${sort.order.split('end')[0]}`] : ''],
                offset: parseInt(offset),
                limit: parseInt(limit)
            });
            const pickResults = findResults.rows.map(item => item.dataValues);
            res.json({
                ret: 0,
                result: { total: findResults.count, offset, limit, data: pickResults }
            });
        } catch (error) {
            responseError(res, error, '查找白名单用户失败');
            logger.error('Get whitelist users fail! payload: %o, error: %o', payload, error);
        }
    },

    async updateUser(payload, req, res) {
        const { uin, openid, id, aegisid, ...other } = payload;
        // uin和openid至少有一个不为空
        if (!id || (!uin && !openid) || (typeof aegisid !== 'string' && typeof aegisid !== 'number')) {
            return res.status(200).json({
                ret: 1002,
                msg: '参数错误'
            });
        }

        try {
            const result = await whitelistService.updateUserByPk(id, {
                ...other,
                uin,
                openid,
                aegisid
            });
            if (!result) {
                return res.status(500).json({
                    ret: 1007,
                    msg: '更新失败'
                });
            }

            syncAndResponse(res);
        } catch (error) {
            responseError(res, error, '更新白名单用户失败');
            logger.error('Update whitelist users fail! payload: %o, error: %o', payload, error);
        }
    },

    async getAegisList(payload, req, res) {
        const { offset = 0, limit = 20, id } = payload;
        try {
            const findResults = await whitelistService.getAegisList({
                where: {
                    id
                },
                offset: parseInt(offset),
                limit: parseInt(limit)
            });
            const pickResults = findResults.rows.map(item => item.dataValues);
            res.json({
                ret: 0,
                result: pickResults
            });
        } catch (error) {
            responseError(res, error, '查找项目列表失败');
            logger.error('Get project list fail! payload: %o, error: %o', payload, error);
        }
    }
};
