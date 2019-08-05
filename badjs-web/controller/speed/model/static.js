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
        }
    }, {
            timestamps: false
        }
    );
    return Static;
}
