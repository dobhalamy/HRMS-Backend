module.exports = (sequelize, DataTypes) => {
  const EmployeeLeave = sequelize.define(
    "EmployeeLeave",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      empId: DataTypes.STRING,
      userId: DataTypes.INTEGER,
      leaveType: DataTypes.STRING,
      leaveFrom: DataTypes.DATE,
      leaveTo: DataTypes.DATE,
      contactNum: DataTypes.STRING,
      leaveDays: DataTypes.JSON,
      leaveReason: DataTypes.STRING,
      leaveDuration: DataTypes.STRING,
      addressDuringLeave: DataTypes.STRING,
      leaveStatus: DataTypes.INTEGER,
      rejectReason: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      poId: DataTypes.INTEGER,
      universalLeaveStatus: DataTypes.INTEGER, 
      isDelete: DataTypes.TINYINT
    },
    {
      tableName: "emp_apply_leave",
    }
  );
  return EmployeeLeave;
};
