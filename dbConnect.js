/* eslint-disable no-console */
const { port } = require('./src/config/server.config')
const startServer = require('./server')
const sequelize = require('./src/config/db.config')

const connectToDB = () => {
  // Ping database to check for common exception errors.
  sequelize
    .authenticate()
    .then(() => {
      console.info('DB connected successfully !!!!')
      startServer(port)
    })
    .catch((error) => {
      console.log('error while connecting to db', error)
    })
}

module.exports = connectToDB
