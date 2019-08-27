'use strict';
const Sequelize = require('sequelize');
const whitelistSequelize = require('../config/sequelize').whiteList;

const WhitelistAegis = whitelistSequelize.define('b_user', {
    role: Sequelize.INTEGER(11),
    verify_state: Sequelize.INTEGER(1),
    loginName: Sequelize.STRING(100),
    chineseName: Sequelize.STRING(100),
    email: Sequelize.STRING(100),
    openid: Sequelize.STRING(32),
}, {
    timestamps: false,
    underscored: false
});

module.exports = WhitelistAegis;
