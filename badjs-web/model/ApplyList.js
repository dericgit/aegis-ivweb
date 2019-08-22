'use strict';
const Sequelize = require('sequelize');
const whitelistSequelize = require('../config/sequelize').whiteList;

const WhitelistAegis = whitelistSequelize.define('b_apply', {
    id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true
    },
    name: Sequelize.STRING(25)
}, {
    timestamps: false
});

module.exports = WhitelistAegis;
