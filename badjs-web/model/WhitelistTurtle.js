'use strict';
const moment = require('moment');
const Sequelize = require('sequelize');
const whitelistTurtleSequelize = require('../config/sequelize').whiteList.turtleSequelize;

const WhitelistTurtle = whitelistTurtleSequelize.define('t_cgi_clour_uin', {
    uin: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        unique: true
    },
    wUin: Sequelize.STRING(64),
    mark: Sequelize.STRING(64),
    operRtx: Sequelize.STRING(64),
    timeliness: Sequelize.INTEGER(11),
    ts: {
        type: Sequelize.DATE,
        get() {
            return moment(this.getDataValue('ts'));
        }
    }
});
WhitelistTurtle.removeAttribute('id');

module.exports = WhitelistTurtle;
