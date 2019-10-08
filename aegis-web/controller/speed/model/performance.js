'use strict'

module.exports = (sequelize, DataTypes) => {
    const Performance = sequelize.define('Performance', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        aegis_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        dns_lookup: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        tcp: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        ssl: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        ttfb: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        content_download: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        dom_parse: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        resource_download: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        times: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        first_screen_timing: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        create_time: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
            timestamps: false,
            indexes: [
                {
                    unique: false,
                    fields: ['create_time']
                }
            ]
        }
    );
    return Performance;
}
