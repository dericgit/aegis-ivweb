
const Sequelize = require('sequelize');
const UserPvSequelize = require('../config/sequelize').sequelize;

const UserPvAegis = UserPvSequelize.define('b_user_pv', {
    id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true
    },
    aegis_id: Sequelize.INTEGER(11),
    user_name: Sequelize.STRING(25),
    create_time: Sequelize.DATE,
    pv_desc: Sequelize.STRING(500)
});

module.exports = UserPvAegis;
