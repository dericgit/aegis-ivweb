const Sequelize = require('sequelize');
const logger = require('log4js').getLogger();
const whitelistService = require('../../service/whitelistService');

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
        await whitelistService.postToAcceptor();
        res.status(204).end();
    } catch (error) {
        logger.error('Post whitelist to acceptor fail!', error);
        res.json({ ret: 1004, msg: `同步白名单到 Acceptor 失败 ${error}` });
    }
}

function assembleWhere({ operator, uin, uid, guid, remark }) {
    const where = {};
    if (operator) {
        where.operator = operator;
    }
    if (uin) {
        where.uin = uin;
    }
    if (uid) {
        where.uid = uid;
    }
    if (guid) {
        where.guid = guid;
    }
    if (remark) {
        where.remark = {
            [Sequelize.Op.like]: `%${remark}%`
        };
    }
    return where;
}

module.exports = {
    async addUser(payload, req, res) {
        const { uin, uid, guid, remark } = payload;
        if (!checkUin(res, uin)) return;

        const { loginName: operator } = req.session.user;
        try {
            const [, isCreated] = await whitelistService.addUser({
                uin,
                uid,
                guid,
                operator,
                remark
            });
            if (!isCreated) {
                return res.status(400).json({
                    ret: 1003,
                    msg: `白名单用户 ${uin} 已经存在！`
                });
            }

            syncAndResponse();
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
        const { uin } = payload;
        if (!checkUin(res, uin)) return;

        const { loginName, role } = req.session.user;

        try {
            const targetUser = await whitelistService.findSingleUser({ uin });
            if (!targetUser) {
                logger.warn('Does not exist whitelist user: [%d]!', uin);
                return res.status(500).json({ ret: 1005, msg: `不存在该白名单用户 ${uin}` });
            }
            // 非管理员只能删除自己添加的白名单用户
            if (role !== ROLE.ADMIN && targetUser.operator !== loginName) {
                logger.error(
                    'Non-administrators can only delete whiteliste users they have added! uin: [%d], operator: [%s], role: [%d]',
                    uin,
                    loginName,
                    role
                );
                return res
                    .stats(403)
                    .json({ ret: 1006, msg: '非管理员只能删除自己添加的白名单用户' });
            }

            const deletedRows = await whitelistService.deleteUser(uin);
            if (deletedRows < 1) {
                throw new Error(null);
            }

            syncAndResponse();
        } catch (error) {
            responseError(res, error, '删除白名单用户失败');
            logger.error(
                'Delete whitelist user fail! uin: [%d], operator: [%s]',
                uin,
                loginName,
                error
            );
        }
    },

    async getUsers(payload, req, res) {
        const findWhere = assembleWhere(payload);
        const { offset = 0, limit = 20 } = payload;
        try {
            const findResults = await whitelistService.findBatchUsers({
                where: findWhere,
                offset,
                limit
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
        const { uin, ...values } = payload;
        if (!checkUin(res, uin)) return;

        try {
            const result = await whitelistService.updateUserByPk(uin, values);
            if (!result) {
                return res.status(500).json({
                    ret: 1007,
                    msg: '更新失败'
                });
            }

            syncAndResponse();
        } catch (error) {
            responseError(res, error, '更新白名单用户失败');
            logger.error('Update whitelist users fail! payload: %o, error: %o', payload, error);
        }
    }
};
