module.exports = (sequalize, DataTypes) => {
  const AttendanceRecord = sequalize.define(
    'AttendanceRecord',
    {
      empId: {
        type: DataTypes.STRING,
        required: true,
        allowNull: false,
      },
      userId: DataTypes.INTEGER,
      date: DataTypes.STRING,
      timeIn: {
        type: DataTypes.STRING,
        required: true,
      },
      timeOut: DataTypes.STRING,
      isPresent: DataTypes.TINYINT,
      totalTime: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      createdAt: {
        type: DataTypes.DATE,
        required: true,
      },
      updatedAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
    },
    {
      tableName: 'attendance_record',
      updatedAt: false,
    },
  )
  return AttendanceRecord
}
