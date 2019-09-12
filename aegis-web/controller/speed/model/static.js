'use strict'

module.exports = (sequelize, DataTypes) => {
    const Static = sequelize.define('Static', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        aegis_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        avg_time: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        create_time: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        city_speed: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        city_status: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        city_distribution: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        times: {
            type: DataTypes.INTEGER,
            allowNull: false
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
    return Static;
}
