const winston = require('winston')
require('winston-daily-rotate-file')

const { combine, timestamp, printf } = winston.format

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/Logs-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
})

const logFormat = printf(({ level, message }) => {
  const logCreationTime = new Date().toLocaleString()
  return `Log Creation:- [${logCreationTime}] : [${level}] ${JSON.stringify(message)}`
})

// const logFormat = printf(
//   const logCreationTime = new Date().toLocaleString()
//   //  ({ level, message }) => `//=> [${timestamp}] : [${level}] ${JSON.stringify(message)} `,
//   ({ level, message }) => `Log Creation:- [${logCreationTime}] : [${level}] ${JSON.stringify(message)} `
// )

const logConfiguration = {
  format: combine(
    timestamp({
      format: 'dd-MM-YYYY HH:mm:ss',
    }),
    winston.format.simple(), 
    logFormat,
  ),
  transports: [fileRotateTransport, new winston.transports.Console()],
}

const logger = winston.createLogger(logConfiguration)

exports.logger = logger
