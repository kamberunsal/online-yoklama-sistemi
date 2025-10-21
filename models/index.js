
const sequelize = require('../config/database');

const User = require('./User');
const Ders = require('./Ders');
const Yoklama = require('./Yoklama');

// Define Associations

// Teacher-Course Relationship (One-to-Many)
User.hasMany(Ders, { foreignKey: 'ogretmenId', as: 'verdigiDersler' });
Ders.belongsTo(User, { foreignKey: 'ogretmenId', as: 'ogretmen' });

// Teacher-Attendance Relationship (One-to-Many)
User.hasMany(Yoklama, { foreignKey: 'ogretmenId' });
Yoklama.belongsTo(User, { foreignKey: 'ogretmenId', as: 'ogretmen' });

// Course-Attendance Relationship (One-to-Many)
Ders.hasMany(Yoklama, { foreignKey: 'dersId', onDelete: 'CASCADE' });
Yoklama.belongsTo(Ders, { foreignKey: 'dersId', as: 'ders' });

// Student-Attendance Relationship (Many-to-Many)
const YoklamaOgrencileri = sequelize.define('YoklamaOgrencileri', {}, { timestamps: false });
User.belongsToMany(Yoklama, { through: YoklamaOgrencileri, as: 'katildigiYoklamalar' });
Yoklama.belongsToMany(User, { through: YoklamaOgrencileri, as: 'katilanOgrenciler' });

// Student-Course Enrollment Relationship (Many-to-Many)
const DersOgrenci = sequelize.define('DersOgrenci', {}, { timestamps: false });
User.belongsToMany(Ders, { through: DersOgrenci, as: 'aldigiDersler' });
Ders.belongsToMany(User, { through: DersOgrenci, as: 'kayitliOgrenciler', hooks: true });


const db = {
    sequelize,
    User,
    Ders,
    Yoklama,
    YoklamaOgrencileri,
    DersOgrenci // Export the new junction model
};

module.exports = db;
