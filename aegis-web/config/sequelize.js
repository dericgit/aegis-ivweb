const Sequelize = require('sequelize');
const path = require('path');

global.pjconfig = require(path.join(__dirname, "..", 'project.json'));

const mysqlUrl = global.pjconfig.mysql.url;

const sequelizeOptions = {
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 1000
    },
    define: {
        // The `timestamps` field specify whether or not the `createdAt` and `updatedAt` fields will be created.
        timestamps: false,
        freezeTableName: true,
        underscored: true
    },
    timezone: '+08:00' //东八时区
};

module.exports = {
    sequelize: new Sequelize(mysqlUrl, sequelizeOptions)
};
