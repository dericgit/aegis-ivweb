
const Sequelize = require('sequelize');
const UserPvSequelize = require('../config/sequelize').sequelize;

const UserPvAegis = UserPvSequelize.define('b_user_pv', {
    id: Sequelize.INTEGER(11),
    aegis_id: Sequelize.INTEGER(11),
    userName: Sequelize.STRING(25),
    createTime: Sequelize.DATE,
    pvDesc: Sequelize.STRING(500)
});

module.exports = UserPvAegis;
