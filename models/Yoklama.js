const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Yoklama = sequelize.define('Yoklama', {
    id: {
        type: DataTypes.UUID, // Using UUID for QR code to be more secure and unique
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tarih: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    yoklamaDurumu: {
        type: DataTypes.ENUM('aktif', 'tamamlandi'),
        defaultValue: 'aktif',
    },
    // dersId and ogretmenId are added automatically via association
    // katilanOgrenciler is handled via the many-to-many association
});

module.exports = Yoklama;