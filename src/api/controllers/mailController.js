const { isEmpty } = require('lodash')
const nodemailer = require('nodemailer')
const { NotFound } = require('../../helper/apiErrors')
const db = require('../models')
const { logger } = require('../../helper/logger')
const MailTemplate = db.mailTemplate
const Employee = db.employee
const ProjectsAssigned = db.projectAssigned
const { UserRole } = require('../../enums/messageNums')

const sendMail = async (email, subject, content) => {
  const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  })

  const mailDetails = {
    from: process.env.MAIL_NAME + `<` + process.env.MAIL_ID + `>`,
    to: email,
    subject: subject,
    html: content,
  }

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      logger.error(`Error sending email to ${email}: ${err.message}`)
      return err
    } else {
      logger.info(`Email sent successfully to ${email}`)
      return data
    }
  })
}
const mailToPoAndHr = async (userId, subject, content) => {
  const hrDetail = await Employee.findOne({
    where: {
      userRole: UserRole.HR,
    },
    attributes: ['userEmail'],
  })
  const projectIds = await ProjectsAssigned.findAll({
    where: { userId },
    attributes: ['projectId'],
    raw: true,
  })
  const poIds = await ProjectsAssigned.findAll({
    where: {
      projectId: projectIds.map((item) => item.projectId),
      employeeProjectRole: 'project_owner',
    },
    attributes: ['userId'],
    raw: true,
  })
  const poEmails = await Employee.findAll({
    where: {
      userId: poIds.map((item) => item.userId),
    },
    attributes: ['userEmail'],
    raw: true,
  })
  const ccAddresses = poEmails.map((employee) => employee.userEmail)
  const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  })

  const mailDetails = {
    from: process.env.MAIL_NAME + `<` + process.env.MAIL_ID + `>`,
    to: hrDetail.userEmail,
    cc: ccAddresses,
    subject: subject,
    html: content,
  }

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      logger.error(`Error sending email to ${hrDetail.userEmail}: ${err.message}`)
      return err
    } else {
      logger.info(`Email sent successfully to ${hrDetail.userEmail} , ${ccAddresses}`)
      return data
    }
  })
}
const sendMailToEmpAndPos = async (email, subject, content) => {
  const empUserId = await Employee.findOne({
    where: {
      userEmail: email,
    },
    attributes: ['userId'],
  })
  const projectIds = await ProjectsAssigned.findAll({
    where: { userId: empUserId.userId },
    attributes: ['projectId'],
    raw: true,
  })
  const poIds = await ProjectsAssigned.findAll({
    where: {
      projectId: projectIds.map((item) => item.projectId),
      employeeProjectRole: 'project_owner',
    },
    attributes: ['userId'],
    raw: true,
  })
  const poEmails = await Employee.findAll({
    where: {
      userId: poIds.map((item) => item.userId),
    },
    attributes: ['userEmail'],
    raw: true,
  })
  const ccAddresses = poEmails.map((employee) => employee.userEmail)
  const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  })

  const mailDetails = {
    from: process.env.MAIL_NAME + `<` + process.env.MAIL_ID + `>`,
    to: email,
    cc: ccAddresses,
    subject: subject,
    html: content,
  }

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      logger.error(`Error sending email to ${email}: ${err.message}`)
      return err
    } else {
      logger.info(`Email sent successfully to ${email} ${ccAddresses}`)
      return data
    }
  })
}
const sendMailToEmp = async (email, subject, content) => {
  const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  })

  const mailDetails = {
    from: process.env.MAIL_NAME + `<` + process.env.MAIL_ID + `>`,
    to: email,
    subject: subject,
    html: content,
  }

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      logger.error(`Error sending email to ${email}: ${err.message}`)
      return err
    } else {
      logger.info(`Email sent successfully to ${email} }`)
      return data
    }
  })
}
const sendMailToHr = async (email, subject, content) => {
  const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  })

  const mailDetails = {
    from: process.env.MAIL_NAME + `<` + process.env.MAIL_ID + `>`,
    to: email,
    subject: subject,
    html: content,
  }

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      logger.error(`Error sending email to ${email}: ${err.message}`)
      return err
    } else {
      logger.info(`Email sent successfully to ${email} }`)
      return data
    }
  })
}
const sendMailToEmpAndHr = async (email, subject, content, userId) => {
  const empUserId = await Employee.findOne({
    where: {
      userEmail: email,
    },
    attributes: ['userId'],
  })
  const projectIds = await ProjectsAssigned.findAll({
    where: { empUserId },
    attributes: ['projectId'],
    raw: true,
  })
  const poIds = await ProjectsAssigned.findAll({
    where: {
      projectId: projectIds.map((item) => item.projectId),
      employeeProjectRole: 'project_owner',
    },
    attributes: ['userId'],
    raw: true,
  })
  const modifiedPoId = poIds.filter((poId) => poId.userId !== userId)
  const poEmails = await Employee.findAll({
    where: {
      userId: modifiedPoId.map((item) => item.userId),
    },
    attributes: ['userEmail'],
    raw: true,
  })
  const ccAddresses = poEmails.map((employee) => employee.userEmail)
  const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASSWORD,
    },
  })

  const mailDetails = {
    from: process.env.MAIL_NAME + `<` + process.env.MAIL_ID + `>`,
    to: email,
    cc: ccAddresses,
    subject: subject,
    html: content,
  }

  mailTransporter.sendMail(mailDetails, function (err, data) {
    if (err) {
      logger.error(`Error sending email to ${email}: ${err.message}`)
      return err
    } else {
      logger.info(`Email sent successfully to ${email} ${ccAddresses}`)
      return data
    }
  })
}

async function getMailTemplate(mailTemplate, callback) {
  try {
    const result = await MailTemplate.findOne({
      where: { uniqueValue: mailTemplate },
    })

    if (isEmpty(result?.content)) {
      throw new NotFound()
    }

    return callback(null, result?.content)
  } catch (error) {
    logger.error(
      {
        controller: 'mailController',
        method: 'getMailTemplate',
      },
      {
        msg: `Error in getMailTemplate: ${error.message}`,
      },
    )
    console.error(error)
  }
}
module.exports = {
  mailToPoAndHr,
  sendMail,
  getMailTemplate,
  sendMailToEmpAndPos,
  sendMailToEmpAndHr,
  sendMailToEmp,
  sendMailToHr,
}
