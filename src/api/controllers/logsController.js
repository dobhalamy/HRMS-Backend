// const express = require('express')
const fs = require('fs').promises
const path = require('path')
const { asyncMiddleware } = require('../middleware/async-middleware')
const logsFolder = path.join(__dirname,'../../..' ,'logs')
// const { getPaginationSize, getPagingData } = require('../../helper/pagination')

// API endpoint to get log files
const getLogs = asyncMiddleware(async (req, res) => {
    const logFiles = await getLogFiles()
  const logs = await readLogFiles(logFiles)
  res.json({ logs })
})

// Function to get a list of log files
const getLogFiles = async () => {
  const files = await fs.readdir(logsFolder)
  return files.filter(file => file.startsWith('Logs-') && file.endsWith('.log'))
}

// // Function to get a list of filtered log files
// const getFilteredLogFiles = async (date) => {
//   const files = await fs.readdir(logsFolder)
//   return files.filter(file => file.startsWith('Logs-') && {date} &&file.endsWith('.log'))
// }

// Function to read content of log files
const readLogFiles = async (logFiles) => {
  const logs = []
  for (const file of logFiles) {
    const filePath = path.join(logsFolder, file)
    const content = await fs.readFile(filePath, 'utf-8')
    logs.push({ fileName: file, content })
  }
  return logs
}

module.exports = {
  getLogs,
}