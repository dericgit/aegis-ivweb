'use strict'

module.exports = (sequelize, DataTypes) => {
    const Script = sequelize.define('Script', {
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
    return Script;
}
