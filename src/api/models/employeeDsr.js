module.exports = (sequelize, DataTypes) => {
  const employeeDsr = sequelize.define(
    "employeeDsr",
    {
      empId: {
        type: DataTypes.STRING,
        required: true,
        unique: true,
        allowNull: false,
      },
      userId :  {
        type: DataTypes.INTEGER,
        required: true,
        unique: true,
        allowNull: false,
      },
      projectId: {
        type: DataTypes.STRING,
        required: true,
        allowNull: false,
      },
      workingDate: DataTypes.DATE,
      workingHours: DataTypes.INTEGER,
      taskDetail: {
        type: DataTypes.STRING,
        required: true,
      },
      taskStatus: {
        type: DataTypes.STRING,
        required: true,
      },
      taskMinutes: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      createdBy: DataTypes.INTEGER,
      updatedAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
    },
    {
      tableName: "vp_emp_dsr",
      updatedAt: false,
    },
  )
  return employeeDsr
}
