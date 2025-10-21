const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ders = sequelize.define('Ders', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    dersAdi: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    sinif: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gun: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    baslangicSaati: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    bitisSaati: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // ogretmenId is added automatically via association
});

module.exports = Ders;