module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    'Employee',
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUID4,
      },
      empId: DataTypes.STRING,
      userName: DataTypes.STRING,
      userPersonalEmail: DataTypes.STRING,
      userEmail: DataTypes.STRING,
      userPassword: DataTypes.STRING,
      userDesignation: DataTypes.STRING,
      userRole: DataTypes.INTEGER,
      userProcess: DataTypes.INTEGER,
      userProfileImg: DataTypes.TEXT,
      empMobileNumber: DataTypes.STRING,
      userBirthday: DataTypes.STRING,
      empJoinDate: DataTypes.DATE,
      empSalary: DataTypes.STRING,
      empCurrentAddress: DataTypes.TEXT,
      empPermanentAddress: DataTypes.TEXT,
      userResetPasswordOtp: DataTypes.STRING,
      userFatherName: DataTypes.STRING,
      userMotherName: DataTypes.STRING,
      userResetPasswordOtpTime: {
        type: 'TIMESTAMP',
      },
      isConcernPerson: DataTypes.TINYINT,
      depId: DataTypes.INTEGER,
      isActive: DataTypes.TINYINT,
      isDeleted: DataTypes.TINYINT,
      userLocked: DataTypes.INTEGER,
    },
    {
      tableName: 'vp_users',
    },
  )
  return Employee
}
