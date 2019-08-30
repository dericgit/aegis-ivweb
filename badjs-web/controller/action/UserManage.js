const Sequelize = require('sequelize');
const logger = require('log4js').getLogger();
const userManageService = require('../../service/UserManageService');

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

function assembleWhere(conditions) {
    const where = {};
    const exactConditions = ['role', 'verify_state', 'id'];
    const blurConditions = ['chineseName'];
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
    // 查找列表
    async getList(payload, req, res) {
        const where = assembleWhere(payload);
        let { offset = '0', limit = '10', chineseName, loginName } = payload;
        if (chineseName || loginName) offset = '0';

        try {
            const findResults = await userManageService.getList({
                where,
                offset: parseInt(offset),
                limit: parseInt(limit)
            });
            const pickResults = findResults.rows.map(item => item.dataValues);
            res.json({
                ret: 0,
                result: { total: findResults.count, offset, limit, data: pickResults }
            });
        } catch (error) {
            responseError(res, error, '获取用户列表失败');
            logger.error('Get userlist fail! payload: %o, error: %o', payload, error);
        }
    },

    // 更新操作
    async update(payload, req, res) {
        // 鉴定必要参数是否传入
        const conditions = ['id', 'chineseName', 'role', 'email', 'verify_state'];
        let pass = true;
        conditions.forEach(item => {
            if (payload[item] === undefined || payload[item] === '') {
                pass = false;
            }
        });
        if (!pass) {
            return res.json({ ret: 1002, msg: '参数错误' });
        }
        const { id, chineseName, role, email, verify_state } = payload;

        try {
            const result = await userManageService.update(parseInt(id), {
                chineseName,
                role,
                email,
                verify_state
            });
            if (!result) {
                return res.status(200).json({
                    ret: 1007,
                    msg: '更新失败，可能是更新的内容与之前内容一致'
                });
            }

            return res.status(200).json({
                ret: 0,
                msg: '更新成功'
            });
        } catch (error) {
            responseError(res, error, '更新用户信息失败');
            logger.error('update user info fail! payload: %o, error: %o', payload, error);
        }
    },

    // 删除用户
    async delete(payload, req, res) {
        const { id } = payload;
        if (!id) {
            return res.json({ ret: 1002, msg: '参数错误' });
        }

        try {
            const targetUser = await userManageService.getList({
                where: { id }
            });
            if (!targetUser.count) {
                logger.warn('Does not exist user: [%d]!', id);
                return res.status(200).json({ ret: 1005, msg: `不存在该用户 ${id}` });
            }

            const deletedRows = await userManageService.delete(id);
            if (deletedRows < 1) {
                throw new Error(null);
            }

            return res.status(200).json({
                ret: 0,
                msg: '删除成功'
            });
        } catch (error) {
            responseError(res, error, '删除用户失败');
            logger.error('delete user fail! payload: %o, error: %o', payload, error);
        }
    }
}
