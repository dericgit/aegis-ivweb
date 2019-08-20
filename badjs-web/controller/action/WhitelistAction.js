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
        await whitelistService.postToAcceptor();
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
    const exactConditions = ['operator', 'uin', 'uid', 'guid'];
    const blurConditions = ['remark'];
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
    // aegisid需要单独判断值
    if (conditions.aegisid) {
        if (parseInt(conditions.aegisid) === 0) {
            where.aegisid = '0';
        } else {
            where.aegisid = {
                [Sequelize.Op.like]: `%/${conditions.aegisid}/%`
            }
        }
    }

    return where;
}

module.exports = {
    async addUser(payload, req, res) {
        const { uin, uid, guid, remark, aegisid } = payload;
        if (!checkUin(res, uin)) return;

        const { loginName: operator } = req.session.user;

        try {
            const [, isCreated] = await whitelistService.addUser({
                uin,
                uid,
                guid,
                operator,
                remark,
                aegisid: aegisid instanceof Array ? `/${aegisid.join('/')}/` : aegisid ? `/${aegisid}/` : ''
            });
            if (!isCreated) {
                return res.status(400).json({
                    ret: 1003,
                    msg: `白名单用户 ${uin} 已经存在！`
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
        const { uin } = payload;
        if (!checkUin(res, uin)) return;

        const { loginName, role } = req.session.user;

        try {
            const targetUser = await whitelistService.findBatchUsers({
                where: {
                    uin: uin
                }
            });
            if (!targetUser.count) {
                logger.warn('Does not exist whitelist user: [%d]!', uin);
                return res.status(500).json({ ret: 1005, msg: `不存在该白名单用户 ${uin}` });
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
                    'Non-administrators can only delete whiteliste users they have added! uin: [%d], operator: [%s], role: [%d]',
                    uin,
                    loginName,
                    role
                );
                return res
                    .status(403)
                    .json({ ret: 1006, msg: '非管理员只能删除自己添加的白名单用户' });
            }

            const deletedRows = await whitelistService.deleteUser(uin);
            if (deletedRows < 1) {
                throw new Error(null);
            }

            syncAndResponse(res);
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
        const { uin, ...values } = payload;
        if (!checkUin(res, uin)) return;
        const aegisid = values.aegisid;
        if (aegisid instanceof Array && !~aegisid.indexOf('0') && !~aegisid.indexOf(0)) {
            values.aegisid = `/${aegisid.join('/')}/`;
        } else if (~aegisid.indexOf('0') || ~aegisid.indexOf(0)) {
            values.aegisid = `0`
        } else {
            values.aegisid = '';
        }

        try {
            const result = await whitelistService.updateUserByPk(uin, values);
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
