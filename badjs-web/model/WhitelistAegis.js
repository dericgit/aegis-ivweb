'use strict';
const Sequelize = require('sequelize');
const whitelistAegisSequelize = require('../config/sequelize').whiteList.aegisSequelize;

const WhitelistAegis = whitelistAegisSequelize.define('b_whitelist', {
    uin: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        primaryKey: true,
    },
    source: {
        type: Sequelize.CHAR(10),
        allowNull: false,
        primaryKey: true,
        defaultValue: 'AEGIS',
    },
    guid: Sequelize.STRING(64),
    remark: Sequelize.STRING(64),
    operator: Sequelize.STRING(64),
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
    }
});
WhitelistAegis.removeAttribute('id');

module.exports = WhitelistAegis;
