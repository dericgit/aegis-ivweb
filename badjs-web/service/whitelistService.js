'user strict';

const moment = require('moment');
const _differenceBy = require('lodash/differenceBy');
const logger = require('log4js').getLogger();
const request = require('request-promise-native');
const WhitelistTurtleModel = require('../model/WhitelistTurtle');
const WhitelistAegisModel = require('../model/WhitelistAegis');

moment.prototype.toMySqlDateTime = function() {
    return this.format('YYYY-MM-DD HH:mm:ss');
};

const WHITELIST_SOURCE = {
    AEGIS: 'AEGIS',
    TURTLE: 'TURTLE'
};

const turtleSourceWhere = {
    where: { source: WHITELIST_SOURCE.TURTLE }
};
const aegisSourceWhere = {
    where: { source: WHITELIST_SOURCE.AEGIS }
};

function transformTurtleToAegis(turtleRecord) {
    const { uin, mark: remark, operRtx: operator, ts } = turtleRecord;
    return {
        uin,
        source: WHITELIST_SOURCE.TURTLE,
        remark,
        operator,
        createdAt: ts.toMySqlDateTime()
    };
}

module.exports = {
    WHITELIST_SOURCE,
    async findUser({ where = {}, limit, offset = 0 }) {
        return WhitelistAegisModel.findAndCountAll({ where, limit, offset });
    },
    /**
     * 添加白名单用户
     * @param {Object} param
     * @param {number} param.uin
     * @param {string} param.operator - 操作者
     * @returns {Array}
     */
    async addUser({ uin, operator, remark }) {
        const [user, isCreated] = await WhitelistAegisModel.findOrCreate({
            where: { uin, source: WHITELIST_SOURCE.AEGIS },
            defaults: {
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
        const deletedRows = await WhitelistAegisModel.destroy({
            where: { ...aegisSourceWhere.where, uin }
        });
        if (deletedRows > 0) {
            logger.info(`Delete whitelist user [${uin}] successfully.`);
        }
        return deletedRows;
    },

    /**
     * 获取 Aegis DB 中的白名单数据 post 到 acceptor
     */
    async postToAcceptor() {
        const whitelist = await WhitelistAegisModel.findAll();
        const conciseWhitelist = whitelist.map(o => ({ uin: o.uin }));
        const options = {
            method: 'POST',
            uri: global.pjconfig.acceptor.pushWhitelistUrl,
            body: {
                whitelist: conciseWhitelist
            },
            json: true // Automatically stringifies the body to JSON
        };

        await request(options);
        logger.info('Post whitelist to Acceptor successfully.');
    },

    /**
     * 同步 turtle 白名单到 Aegis
     */
    async syncTurtleWhiteList() {
        logger.info('Start sync Aegis whitelist from Turtle...');
        const turtleRecords = await WhitelistTurtleModel.findAll();
        // only concern aegis records with turtle source
        const aegisRecords = await WhitelistAegisModel.findAll(turtleSourceWhere);

        // compare differences in two tables, then insert and delete in aegis records
        // aegisRecords - turtleRecords = records that need to be deleted(temporary whitelist)
        const deletedRecords = _differenceBy(aegisRecords, turtleRecords, 'uin');
        if (deletedRecords.length) {
            await WhitelistAegisModel.destroy({
                where: { ...turtleSourceWhere.where, uin: deletedRecords.map(o => o.uin) }
            });
        }
        // turtleRecords - aegisRecords = new whitelist records
        const insertedRecords = _differenceBy(turtleRecords, aegisRecords, 'uin');
        if (insertedRecords.length) {
            await WhitelistAegisModel.bulkCreate(insertedRecords.map(transformTurtleToAegis));
        }
        logger.info(
            `Successfully sync Aegis whitelist from Turtle: delete ${
                deletedRecords.length
            }, insert ${insertedRecords.length}`
        );
    }
};
