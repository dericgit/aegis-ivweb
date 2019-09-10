const logger = require('log4js').getLogger();
const UserPvService = require('../../service/UserPvService');

module.exports = {
    async addUserPv(payload, req, res) {
        const { aegis_id, pvDesc } = payload;

        if (!aegis_id || !pvDesc) {
            return res.status(500).json({
                ret: 1002,
                msg: '参数错误'
            });
        }
        const { loginName: userName } = req.session.user;

        try {
            const [userPv, isCreated] = await UserPvService.addUserPv({
                userName,
                ...payload
            });
            return res.status(200).json({
                ret: 0,
                data: userPv
            });
        } catch (error) {
            res.status(500).json({
                ret: 1000,
                msg: error
            });
        }
    },

    async deleteUser(payload, req, res) {
        const { id } = payload;

        if (!id) {
            return res.status(500).json({
                ret: 1002,
                msg: '参数错误'
            })
        }

        try {
            const result = await UserPvService.deleteUserPv(id);
            if (!result.count) {
                logger.warn('Does not exist user pv: [%d]!', id);
                return res.status(500).json({ ret: 1005, msg: `不存该值 ${id}` });
            } else {
                return res.status(200).json({
                    ret: 0,
                    data: userPv
                });
            }
        } catch (error) {
            res.status(500).json({
                ret: 1000,
                msg: error
            });
        }
    },

    async updateUserPv(payload, req, res) {
        const { id, pvDesc } = payload;

        if (!id || !pvDesc) {
            return res.status(500).json({
                ret: 1002,
                msg: '参数错误'
            });
        }

        try {
            const result = await UserPvService.updateUserPvDesc(id, {pvDesc});
            if (!result) {
                return res.status(500).json({
                    ret: 1007,
                    msg: '更新失败'
                });
            }
            return res.status(200).json({
                ret: 0,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                ret: 1000,
                msg: error
            });
        }
    }
};
