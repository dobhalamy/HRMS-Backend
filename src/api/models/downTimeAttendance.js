module.exports = (sequalize, DataTypes) => {
  const DownTimeAttendance = sequalize.define(
    'DownTimeAttendance',
    {
      userId: {
        type: DataTypes.INTEGER,
        required: true,
        allowNull: false,
      },
      departmentId: {
        type: DataTypes.INTEGER,
        required: true,
      },
      departmentHead: DataTypes.INTEGER,
      subject: DataTypes.STRING,
      description: DataTypes.TEXT,
      date: DataTypes.STRING,
      startTime: DataTypes.DATE,
      endTime: DataTypes.DATE,
      status: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      createdAt: {
        type: DataTypes.DATE,
        required: true,
      },
      updatedAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
      remark: DataTypes.TEXT,
    },
    {
      tableName: 'down_time_attendance',
      updatedAt: false,
    },
  )
  return DownTimeAttendance
}
