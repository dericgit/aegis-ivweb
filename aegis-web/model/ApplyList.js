'use strict';
const Sequelize = require('sequelize');
const sequelize = require('../config/sequelize').sequelize;

const ApplyModel = sequelize.define('b_apply', {
    id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true
    },
    name: Sequelize.STRING(25)
}, {
    timestamps: false
});

module.exports = ApplyModel;
