const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ad: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    soyad: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    okulNumarasi: {
        type: DataTypes.STRING,
        allowNull: true, // Null for teachers/admins
    },
    rol: {
        type: DataTypes.ENUM('ogrenci', 'ogretmen', 'admin'),
        allowNull: false,
        defaultValue: 'ogrenci',
    },
});

module.exports = User;