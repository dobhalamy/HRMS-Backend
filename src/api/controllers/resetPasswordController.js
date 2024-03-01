const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const db = require('../models/index')
const { Op } = require('sequelize')
const { logger } = require('../../helper/logger')
const HttpStatusCode = require('../../enums/httpErrorCodes')
const { sendMail } = require('./mailController')
const Employee = db.employee
const MailTemplate = db.mailTemplate
const ResetPassword = db.resetPassword

const checkMailId = async (req, res) => {
    const {emailId, url} = req.body
    try{
        let isExist={}
        if(emailId){
            isExist = await Employee.findOne({
              where: {
                [Op.and]: [{ userEmail: emailId}]
              }
            })
        }
        if(isExist){
            // Generate a random token using crypto
            const token = crypto.randomBytes(32).toString('hex') // 32 bytes as a hexadecimal string

            const expirationTimeInMilliseconds = 15 * 60 * 1000
            const currentTimestamp = Date.now()
            const expirationTimestamp = currentTimestamp + expirationTimeInMilliseconds

            // Combine the token and expiration time with a separator (|)
            const combinedToken = `${token}|${expirationTimestamp}`

            const tokenData = {
                combinedToken
            }
            
            // Convert the token object to a JSON string
            const tokenString = JSON.stringify(tokenData)

            const mailTemplate = 'reset_password'
            const templateData = await MailTemplate.findOne({
              where: { uniqueValue: mailTemplate },
            })
            let templateResponse = templateData?.content

            const resetLink = `http://${url}/auth/reset-password?token=${token}`
            if (templateResponse) {
              templateResponse = templateResponse.replace('{{name}}', isExist?.dataValues?.userName)
              templateResponse = templateResponse.replace('{{empId}}', isExist?.dataValues?.empId)
              templateResponse = templateResponse.replace('{{link}}', resetLink)
          
              const subject = 'Reset Password'

              await sendMail(isExist?.dataValues?.userEmail, subject, templateResponse)
            }
            const requestForResetPassword = await ResetPassword.create({
              email: emailId,
              token: token,
              expire_at: new Date(expirationTimestamp),
              created_at: new Date()
            },
            {
              fields: ['email', 'token', 'created_at', 'expire_at'] 
            })
          
            res.status(HttpStatusCode.OK).send({
                status: true,
                message: 'Mail Sent Successfully(Please check your mail)',
                statusCode: HttpStatusCode.OK,
            })
            logger.info({
                controller: 'resetPasswordController',
                method: 'checkMailId',
                msg: 'Password Reset Successfully',
            })
        } else{
            res.status(200).json({
                status: false,
                message: 'This email Id does not exist',  
            })
        }
    } catch (error){
        res.status(400).json({
            status: false,
            message: error,
        })
        logger.error({
            controller: 'resetPasswordController',
            method: 'checkMailId',
            msg: `Catch error: ${error?.message}`,
          })
    }
}

const compareToken = async (req, res) => {
  const { token } = req.params 
  try {
    const resetPasswordRecord = await ResetPassword.findOne({
      where: {
        token,
      },
    }) 
    if (!resetPasswordRecord) {
      return res.status(404).json({
        status: false,
        message: 'Link has expired',
      })
    }
    
    const expirationTimestamp = new Date(resetPasswordRecord.expire_at).getTime()
    const currentTimestamp = Date.now()
    if (currentTimestamp > expirationTimestamp) {
      const result = await ResetPassword.destroy({
        where: { token }
      })
      return res.status(400).json(
        { status: false,
          message: 'Link has expired'
        })
    }else{
      return res.status(200).json({
        status: true,
        message: 'restPassword' 
      })
    }

  } catch (error) {
    console.error(error);
    logger.error({
      controller: 'resetPasswordController',
      method: 'checkMailId',
      msg: `Catch error: ${error?.message}`,
    })
    return res.status(500).json({
      status: false,
      message: 'Internal server error',
    })
  }
}

const updatePassword = async (req, res) => {
  const { email, newPassword } = req.body
  try {
    const employee = await Employee.findOne({
      where: { userEmail: email },
    })

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(newPassword, salt)
    if (employee) {
      await Employee.update(
        { userPassword: hashedPassword },
        {
          where: { userEmail: email },
        },
      )
      return res.json({
        message: 'Password updated successfully',
      })
    } else {
      return res.json({
        message: 'Email not found',
      })
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}

const setExpirationLink = async(req,res) => {
  const { token } = req.params 
    const resetPasswordRecord = await ResetPassword.findOne({
      where: {
        token,
      },
    })

    if (!resetPasswordRecord) {
      return res.status(404).json({
        status: false,
        message: 'Token not found',
      })
    }
    if (resetPasswordRecord.token !== token) {
      return res.status(403).json({
        status: false,
        message: 'Token does not match',
      });
    }  
    const isDeleted = ResetPassword.destroy({
      where: {token}
    })
    if(isDeleted){
      res.status(200).json({
        status: true,
        data: resetPasswordRecord,
        message: 'deleted'
      })
    }
}

module.exports = {checkMailId, 
                  compareToken, 
                  updatePassword, 
                  setExpirationLink} 