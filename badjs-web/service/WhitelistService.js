'user strict';

const moment = require('moment');
const logger = require('log4js').getLogger();
const request = require('request-promise-native');
const WhitelistModel = require('../model/Whitelist');
const ApplyList = require('../model/ApplyList');

moment.prototype.toMySqlDateTime = function () {
    return this.format('YYYY-MM-DD HH:mm:ss');
};

module.exports = {
    /**
     * 分页查找
     * @param {number} params.offset - 偏移量
     * @param {number} params.limit - 单次查找数量
     */
    async findBatchUsers({ where = {}, order, limit, offset = 0 }) {
        return WhitelistModel.findAndCountAll({ where, order, limit, offset });
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
    async addUser({ uin, openid, aegisid, ...payload }) {
        const conditionMap = { uin, openid, aegisid };
        const where = {};
        for (const key in conditionMap) {
            if (conditionMap[key] !== undefined) {
                where[key] = conditionMap[key];
            }
        }
        const [user, isCreated] = await WhitelistModel.findOrCreate({
            where,
            defaults: {
                ...payload
            }
        });
        if (isCreated) {
            logger.info(`Insert user [${uin}] to whitelist db successfully.`);
        }
        return [user, isCreated];
    },

    /**
     * 批量添加白名单用户
     * @param {array} users 
     */
    async addBulkUser(users) {
        const [user, isCreated] = await WhitelistModel.bulkCreate(users);
        if (isCreated) {
            logger.info(`Insert whitelist users success`);
        }
        return [user, isCreated];
    },

    /**
     * 删除白名单用户
     * @param {number} id
     * @returns {Promise<number>} - 删除成功的记录数
     */
    async deleteUser(id) {
        const deletedRows = await WhitelistModel.destroy({
            where: { id }
        });
        if (deletedRows > 0) {
            logger.info(`Delete whitelist user [${id}] successfully.`);
        }
        return deletedRows;
    },

    /**
     * 按照条件删除白名单用户
     * @param {*} where 
     */
    async deleteUsersByConditions(where) {
        const deletedRows = await WhitelistModel.destroy({ 'where': where });
        if (deletedRows > 0) {
            logger.info(`Delete whitelist user [${id}] successfully.`);
        }
        return deletedRows;
    },

    /**
     * 根据 uin 主键更新记录
     * @param {string} uin
     * @param {Object} values - 有更新的 fields
     */
    async updateUserByPk(id, values) {
        const [afftedRows] = await WhitelistModel.update(values, { where: { id } });
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

        await request(options);
        logger.info('Post whitelist to Acceptor successfully.');
    },

    /**
     * 白名单需求中获取项目列表
     */
    async getAegisList({ where = {}, limit, offset = 0 }) {
        return ApplyList.findAndCountAll({ where, limit, offset });
    }
};
