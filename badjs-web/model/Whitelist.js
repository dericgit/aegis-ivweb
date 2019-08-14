'use strict';
const Sequelize = require('sequelize');
const whitelistSequelize = require('../config/sequelize').whiteList;

const WhitelistAegis = whitelistSequelize.define('b_whitelist', {
    uin: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
    },
    uid: Sequelize.STRING(20),
    guid: Sequelize.STRING(64),
    remark: Sequelize.STRING(64),
    operator: Sequelize.STRING(64),
    aegisid: Sequelize.STRING(20)
});
WhitelistAegis.removeAttribute('id');

module.exports = WhitelistAegis;
