'use strict'

module.exports = (sequelize, DataTypes) => {
    const Img = sequelize.define('Img', {
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
            type: DataTypes.STRING(20),
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
    return Img;
}
