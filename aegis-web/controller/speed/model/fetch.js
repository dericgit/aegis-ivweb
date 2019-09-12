'use strict'

module.exports = (sequelize, DataTypes) => {
    const Fetch = sequelize.define('Fetch', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        aegis_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        url: {
            type: DataTypes.STRING(3000),
            allowNull: false
        },
        times: {
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
        status: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        distribution: {
            type: DataTypes.TEXT,
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
    return Fetch;
}
