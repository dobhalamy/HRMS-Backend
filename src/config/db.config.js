// const fs = require('fs')
const { Sequelize } = require('sequelize')

const dbConfig = {
  name: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
}

const sequelize = new Sequelize(dbConfig?.name, dbConfig?.username, dbConfig?.password, {
  host: dbConfig?.host,
  port: dbConfig?.port,
  dialect: dbConfig?.dialect,
  pool: { min: 0, max: 5, idle: 10000 },
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
})

module.exports = sequelize
