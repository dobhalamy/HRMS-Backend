module.exports = (sequelize, DataTypes) => {
  const Exception = sequelize.define(
    'Exception',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: DataTypes.INTEGER,
      requestType: DataTypes.INTEGER, // id from the global type
      dateFrom: DataTypes.DATE,
      dateTo: DataTypes.DATE,
      shiftIn: DataTypes.DATE,
      shiftOut: DataTypes.DATE,
      currentAttendance: DataTypes.STRING,
      updateAttendance: DataTypes.STRING,
      accessIn: DataTypes.DATE,
      accessOut: DataTypes.DATE,
      comment: DataTypes.TEXT,
      exceptionStatus: DataTypes.TINYINT,
      exceptionRemark: DataTypes.STRING,
    },
    {
      tableName: 'exception',
    },
  )
  return Exception
}
