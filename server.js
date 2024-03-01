/* eslint-disable no-console */
const http = require('http')
const express = require('express')
global.__basedir = __dirname
const multer = require('multer')
const app = express()
const cors = require('cors')
const storage = multer.memoryStorage()
const upload = multer({ storage })
// const socketIo = require('socket.io')
// const {
//   saveNotification,
//   getNotification,
// } = require('./src/api/controllers/notificationController')

const {
  authRoute,
  roleRoute,
  globalTypeCategory,
  globalType,
  employeeRoute,
  staticContent,
  eventRoute,
  media,
  formBuilderRoute,
  saveFormDataRoute,
  genericRoute,
  clientInfoRoute,
  projectInfoRoute,
  attendanceRoute,
  happyToHelpRoute,
  rosterUpload,
  exceptionRoute,
  moduleRoute,
  userRoute,
  resetPasswordRoute,
  notificationRoute,
  logsRoute,
  holidayRoute
} = require('./src/api/routes/index')

const httpServer = http.createServer(app)

// const io = socketIo(httpServer)

const startServer = (port) => {
  // middleware
  app.use('*', cors())

  /////////////////////////socket io implementation///////////////////
  // io.on('connection', (socket) => {
  //   console.log('A user connected')

  //   // Handle errors on the socket
  //   socket.on('error', (error) => {
  //     console.error('Socket.IO Error:', error)
  //   })

  //   socket.on('loggedInData', async (loggedInData) => {
  //     const response = await getNotification(loggedInData?.userId)
  //     const data = response?.data?.notifications
  //     socket.emit('notifications', data)
  //   })

  //   socket.on('applyForLeave', async (leaveRequest, userId) => {
  //     const data = { message: 'New Leave Request', createdAt: leaveRequest?.updatedAt }
  //     await saveNotification({ data: data, userId: userId, eventType: 'applyForLeave' })
  //     io.emit('newNotification')
  //   })

  //   //leave request reject
  //   socket.on('leaveRejected', async (leaveRejected, userId) => {
  //     const data = { message: 'Leave Request Rejected', data: leaveRejected }
  //     await saveNotification({ data: data, userId: userId, eventType: 'leaveReject' })
  //     io.emit('newNotification')
  //   })

  //   //leave request approve
  //   socket.on('leaveApproved', async (leaveApprove, userId) => {
  //     const data = { message: 'Leave Request Approved', data: leaveApprove }
  //     await saveNotification({ data: data, userId: userId, eventType: 'leaveApproved' })
  //     io.emit('newNotification')
  //   })

  //   //hr->trainer and agent  agent assign/trainer assign
  //   socket.on('agentAssign', async (agentData, userId) => {
  //     const data = {
  //       message: ['New Trainer Assign', 'New Trainee Assign'],
  //       data: agentData?.data?.data,
  //     }
  //     await saveNotification({ data: data, userId: userId, eventType: 'agentAssign' })
  //     io.emit('newNotification')
  //   })

  //   //employee->hr exception raised
  //   socket.on('exceptionRequest', async (exceptionData) => {
  //     const data = { message: 'New Exception Request', data: exceptionData?.data?.data }
  //     await saveNotification({
  //       data: data,
  //       userId: exceptionData?.data?.data?.userId,
  //       eventType: 'exceptionRequest',
  //     })
  //     io.emit('newNotification')
  //   })

  //   //hr -> employee (reject)
  //   socket.on('rejectException', async (rejectException) => {
  //     const data = { message: 'Exception Request Rejected', data: rejectException }
  //     await saveNotification({
  //       data: data,
  //       userId: rejectException?.userId,
  //       eventType: 'rejectException',
  //     })
  //     io.emit('newNotification')
  //   })

  //   //hr -> employee (approve)
  //   socket.on('approveException', async (approveException) => {
  //     const data = { message: 'Exception Request Approve', data: approveException }
  //     await saveNotification({
  //       data: data,
  //       userId: approveException?.userId,
  //       eventType: 'approveException',
  //     })
  //     io.emit('newNotification')
  //   })

  //   //employee -> hr (happy to help added)
  //   socket.on('happyToHelpAdded', async (happyToHelpData) => {
  //     const data = { message: 'New Happy To Help Request', data: happyToHelpData }
  //     await saveNotification({ data: data, eventType: 'happyToHelpAdded' })
  //     io.emit('newNotification')
  //   })
  //   //employee -> hr (dsr added)
  //   socket.on('dsrAdded', async (dsrData) => {
  //     const data = { message: 'New Dsr added', data: dsrData }
  //     await saveNotification({ data: data, eventType: 'dsrAdded' })
  //     console.log('after save-----')
  //     io.emit('newNotification')
  //   })

  //   socket.on('disconnect', () => {
  //     console.log('User disconnected')
  //   })
  // })

  
  app.use(express.json())
  app.use('/api/v1/role/', roleRoute)
  app.use('/api/v1/auth/', authRoute)
  app.use('/api/v1/globaltypecategory/', globalTypeCategory)
  app.use('/api/v1/globaltype/', globalType)
  app.use('/api/v1/employee', employeeRoute)
  app.use('/api/v1/staticContent', staticContent)
  app.use('/api/v1/event', eventRoute)
  app.use('/api/v1/media', media)
  app.use('/upload', express.static(__dirname + '/upload'))
  app.use('/api/v1/formBuilder', formBuilderRoute)
  app.use('/api/v1/saveFormData', saveFormDataRoute)
  app.use('/api/v1', genericRoute)
  app.use('/api/v1/attendance', upload.single('file'), attendanceRoute)
  app.use('/api/v1/happyToHelp', happyToHelpRoute)
  app.use('/api/v1/exception', exceptionRoute)
  app.use('/api/v1/clientInfo', clientInfoRoute)
  app.use('/api/v1/projectInfo', projectInfoRoute)
  app.use('/api/v1/roster', rosterUpload)
  app.use('/api/v1/modules', moduleRoute)
  app.use('/api/v1/userInfo', userRoute)
  app.use('/api/v1/resetPassword', resetPasswordRoute)
  app.use('/api/v1/notification', notificationRoute)
  app.use('/api/v1/logs', logsRoute)
  app.use('/api/v1/holidays', holidayRoute)
  httpServer.listen(port, () => {
    console.info(`Server is on ${port}`)
  })
  httpServer.timeout = 60000
}

module.exports = startServer
