/**
 * 用来操作用户自定义pv
 */
const UserPvModel = require('../model/UserPv.js');

module.exports = {

    async findBatchPv({ where = {}, order, limit = 10, offset = 0 }) {
        return await UserPvModel.findAndCountAll({ where, order, limit, offset });
    },

    async addUserPv({aegis_id, userName, pvDesc}) {
        return UserPvModel.create({ aegis_id, userName, pvDesc });
    },

    async deleteUserPv(id) {
        return UserPvModel.destroy({
            where: { id }
        });
    }

}