module.exports = (sequalize, DataTypes) => {
  const AprRecord = sequalize.define(
    'AprRecord',
    {
      empId: {
        type: DataTypes.STRING,
        required: true,
        allowNull: false,
      },
      date: DataTypes.STRING,
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
      tableName: 'apr_record',
      updatedAt: false,
    },
  )
  return AprRecord
}
