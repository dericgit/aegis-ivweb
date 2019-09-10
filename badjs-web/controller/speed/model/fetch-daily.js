'use strict'

module.exports = (sequelize, DataTypes) => {
    const FetchDaily = sequelize.define('FetchDaily', {
        aegis_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        create_time: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            primaryKey: true
        },
        speed: {
            type: DataTypes.FLOAT,
            allowNull: false
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
    return FetchDaily;
}
