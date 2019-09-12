'use strict';
const Sequelize = require('sequelize');
const whitelistSequelize = require('../config/sequelize').sequelize;

const WhitelistAegis = whitelistSequelize.define('b_whitelist', {
    openid: Sequelize.STRING(20),
    uin: Sequelize.STRING(20),
    uid: Sequelize.STRING(20),
    aid: Sequelize.STRING(64),
    remark: Sequelize.STRING(64),
    operator: Sequelize.STRING(64),
    aegisid: Sequelize.STRING(20)
});

module.exports = WhitelistAegis;
