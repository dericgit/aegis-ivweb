'use strict';
const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize').sequelize;

const UserManageModel = sequelize.define('b_user', {
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

module.exports = UserManageModel;
