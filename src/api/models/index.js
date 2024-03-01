const { Sequelize, DataTypes } = require('sequelize')
const sequelize = require('../../config/db.config')

const db = {}
db.sequelize = sequelize
db.Sequelize = Sequelize
db.roleAndPermissions = require('./rolePermissions')(sequelize, DataTypes)
db.globalTypeCategory = require('./globalTypeCategory')(sequelize, DataTypes)
db.globalType = require('./globalType')(sequelize, DataTypes)
db.employee = require('./employee')(sequelize, DataTypes)
db.employeeLeave = require('./empLeave')(sequelize, DataTypes)
db.events = require('./events')(sequelize, DataTypes)
db.employeeDsr = require('./employeeDsr')(sequelize, DataTypes)
db.happyToHelp = require('./happyToHelp')(sequelize, DataTypes)
db.projectsName = require('./projectsName')(sequelize, DataTypes)
db.attendanceRecord = require('./attendanceRecord')(sequelize, DataTypes)
db.aprRecord = require('./aprRecord')(sequelize, DataTypes)
db.staticContent = require('./staticContent')(sequelize, DataTypes)
db.media = require('./media')(sequelize, DataTypes)
db.formBuilder = require('./formBuilder')(sequelize, DataTypes)
db.clientInformation = require('./clientInformation')(sequelize, DataTypes)
db.saveFormData = require('./saveFormData')(sequelize, DataTypes)
db.mailTemplate = require('./mailTemplate')(sequelize, DataTypes)
db.downTimeAttendance = require('./downTimeAttendance')(sequelize, DataTypes)
db.exception = require('./exception')(sequelize, DataTypes)
db.projectInformation = require('./projectInfo')(sequelize, DataTypes)
db.projectAssigned = require('./projectAssigned')(sequelize, DataTypes)
db.roster = require('./rosterModal')(sequelize, DataTypes)
db.globalTypeMapping = require('./globalTypeMapping')(sequelize, DataTypes)
db.rygStatus = require('./rygStatus')(sequelize, DataTypes)
db.modulePermissions = require('./modulePermissions')(sequelize, DataTypes)
db.traineeDetails = require('./traineeDetails')(sequelize, DataTypes)
db.traineeHistory = require('./trainingHistory')(sequelize, DataTypes)
db.resetPassword = require('./resetPassword')(sequelize, DataTypes)
db.notification = require('./notification')(sequelize, DataTypes)
db.holidayCalender = require('./holidayCalender')(sequelize, DataTypes)
db.employeeLeaveDays = require('./empLeaveDays')(sequelize, DataTypes)
db.dsrQuery = require('./dsrQuery')(sequelize, DataTypes)
db.projectDocument = require('./projectDocument')(sequelize, DataTypes)

// write table relations here
db.employeeDsr.belongsTo(db.employee, {
  foreignKey: 'empId',
  targetKey: 'empId',
  attributes: ['userName'],
  as: 'employee',
})
db.employee.belongsTo(db.globalType, {
  foreignKey: 'userProcess',
  targetKey: 'id',
  attributes: ['displayName'],
  as: 'processName',
})
db.roster.belongsTo(db.employee, {
  foreignKey: 'empId',
  targetKey: 'empId',
  attributes: ['userName', 'depId'],
  as: 'employee',
})
db.attendanceRecord.belongsTo(db.employee, {
  foreignKey: 'userId',
  targetKey: 'userId',
  attributes: ['userName'],
  as: 'employee',
})
db.media.belongsTo(db.employee, {
  foreignKey: 'empId',
  targetKey: 'empId',
  attributes: ['userName'],
  as: 'employee',
})

db.projectInformation.belongsTo(db.clientInformation, {
  foreignKey: 'clientId',
  targetKey: 'id',
  as: 'clientInfo',
})
db.projectInformation.hasMany(db.projectAssigned, {
  foreignKey: 'projectId',
  sourceKey: 'projectId',
  as: 'developers',
})
db.employeeDsr.hasMany(db.dsrQuery, {
  foreignKey: 'dsrId',
  sourceKey: 'id',
  attributes: ['query', 'createdAt'],
  as: 'queries',
})

db.projectInformation.hasMany(db.employeeDsr,{
  foreignKey:'projectId',
  sourceKey:'projectId',
  as:'totalBiling'
})

db.employee.hasMany(db.media, {
  foreignKey: 'empId',
  sourceKey: 'empId',
  as: 'documents',
})
db.exception.belongsTo(db.globalType, {
  foreignKey: 'requestType',
  targetKey: 'id',
  attributes: ['displayName'],
  as: 'raisedRequest',
})
db.employee.belongsTo(db.globalType, {
  foreignKey: 'userDesignation',
  targetKey: 'uniqueValue',
  attributes: ['displayName'],
  as: 'designation',
})
db.exception.belongsTo(db.employee, {
  foreignKey: 'userId',
  targetKey: 'userId',
  attributes: ['userName'],
  as: 'employeeName',
})
db.employeeDsr.belongsTo(db.projectInformation , {
  foreignKey: 'projectId',
  targetKey: 'projectId',
  attributes: ['projectName'],
  as: 'projectName',
})
db.globalTypeMapping.belongsTo(db.globalType)
db.employee.belongsTo(db.rygStatus, {
  foreignKey: 'userId',
  targetKey: 'empId',
})
db.rygStatus.belongsTo(db.globalType, {
  foreignKey: 'status',
  targetKey: 'id',
})
db.rygStatus.belongsTo(db.globalType, {
  foreignKey: 'subStatus',
  targetKey: 'id',
})
db.happyToHelp.belongsTo(db.globalType, {
  foreignKey: 'issue',
  targetKey: 'id',
})
db.modulePermissions.belongsTo(db.globalType, {
  foreignKey: 'moduleId',
  targetKey: 'id',
  as: 'moduleInfo',
})
db.modulePermissions.belongsTo(db.globalType, {
  foreignKey: 'permissions',
  targetKey: 'id',
  as: 'permissionsInfo',
})
db.employee.belongsTo(db.traineeDetails, {
  foreignKey: 'userId',
  targetKey: 'userId',
})
db.employee.hasMany(db.projectAssigned, {
  foreignKey: 'userId',
  sourceKey: 'userId',
  as: 'projects',
})
db.dsrQuery.belongsTo(db.employee, {
  foreignKey: 'userId',
  sourceKey: 'userId',
  as: 'displayName',
})
db.projectAssigned.belongsTo(db.employee, {
  foreignKey: 'userId',
  targetKey: 'userId',
})
db.employeeLeave.belongsTo(db.employee, {
  foreignKey: 'userId',
  sourceKey: 'userId',
  as: 'requestedUser',
})
db.employeeLeave.belongsTo(db.employee, {
  foreignKey: 'poId',
  sourceKey: 'userId',
  as: 'poUser', 
})
db.employeeLeave.belongsTo(db.employee, {
  foreignKey: 'userId',
  sourceKey: 'userId',
})
db.employeeLeaveDays.belongsTo(db.employeeLeave,{
  foreignKey: 'leaveId',
  sourceKey: 'id'
})

// keep the sync in the end of function and run the sync only when you make changes to any modal schemas
// sequelize.sync().then(() => {
//   console.log('sync is done')
// })
module.exports = db
