'user strict';

const moment = require('moment');
const logger = require('log4js').getLogger();
const request = require('request-promise-native');
const WhitelistModel = require('../model/Whitelist');

moment.prototype.toMySqlDateTime = function() {
    return this.format('YYYY-MM-DD HH:mm:ss');
};

module.exports = {
    /**
     * 分页查找
     * @param {number} params.offset - 偏移量
     * @param {number} params.limit - 单次查找数量
     */
    async findBatchUsers({ where = {}, limit, offset = 0 }) {
        return WhitelistModel.findAndCountAll({ where, limit, offset });
    },

    /**
     * 根据条件查找单条记录
     * @param {Object} where
     */
    async findSingleUser(where) {
        return WhitelistModel.findOne({ where });
    },

    /**
     * 添加白名单用户
     * @param {Object} param
     * @param {number} param.uin
     * @param {string} param.operator - 操作者
     * @returns {Array}
     */
    async addUser({ uin, uid, operator, remark }) {
        const [user, isCreated] = await WhitelistModel.findOrCreate({
            where: { uin },
            defaults: {
                uid,
                operator,
                remark
            }
        });
        if (isCreated) {
            logger.info(`Insert user [${uin}] to whitelist db successfully.`);
        }
        return [user, isCreated];
    },

    /**
     * 删除白名单用户
     * @param {number} uin
     * @returns {Promise<number>} - 删除成功的记录数
     */
    async deleteUser(uin) {
        const deletedRows = await WhitelistModel.destroy({
            where: { uin }
        });
        if (deletedRows > 0) {
            logger.info(`Delete whitelist user [${uin}] successfully.`);
        }
        return deletedRows;
    },

    /**
     * 根据 uin 主键更新记录
     * @param {string} uin
     * @param {Object} values - 有更新的 fields
     */
    async updateUserByPk(uin, values) {
        const [afftedRows] = await WhitelistModel.update(values, { where: { uin } });
        return afftedRows > 0;
    },

    /**
     * 白名单更新后， post 到 acceptor
     */
    async postToAcceptor() {
        const whitelist = await WhitelistModel.findAll();
        const conciseWhitelist = whitelist.reduce((p, c) => {
            if (!p[c.aegisid]) {
                p[c.aegisid] = {};
            }
            p[c.aegisid][c.uin] = 1; 
            return p;
        }, {});
        const options = {
            method: 'POST',
            uri: global.pjconfig.acceptor.pushWhitelistUrl,
            body: {
                whitelist: conciseWhitelist,
                auth: 'badjsAcceptor'
            },
            json: true // Automatically stringifies the body to JSON
        };
        try {
            await request(options);
            logger.info('Post whitelist to Acceptor successfully.');
        } catch (e) {
            logger.warn('Post whitelist to Acceptor fail.');
        }
    }
};
