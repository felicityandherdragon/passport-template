const Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/testingpassport', {
  logging: false
});

module.exports = sequelize
