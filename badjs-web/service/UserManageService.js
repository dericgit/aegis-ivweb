const logger = require('log4js').getLogger();
const userManageModal = require('../model/UserManage');

module.exports = {
    /**
     * 分页查找
     * @param {number} limit
     * @param {number} offset
     */
    async getList({ where = {}, limit = 10, offset = 0 }) {
        return userManageModal.findAndCountAll({ where, limit, offset });
    },

    /**
     * 更新用户信息
     */
    async update(id, values) {
        const [afftedRows] = await userManageModal.update(values, { where: { id } });
        return afftedRows > 0;
    },

    /**
     * 删除用户
     */
    async delete(id) {
        const deletedRows = await userManageModal.destroy({
            where: { id }
        });
        if (deletedRows > 0) {
            logger.info(`Delete user [${id}] successfully.`);
        }
        return deletedRows;
    }
}