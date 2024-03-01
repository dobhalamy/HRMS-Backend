module.exports = (sequelize, DataTypes) => {
  const TrainingHistory = sequelize.define(
    'TrainingHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
      },
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      certificationDate: DataTypes.DATE,
      certificationStatus: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      trainingHandoverDate: DataTypes.DATE,
    },
    {
      tableName: 'traininghistory',
    },
  )
  return TrainingHistory
}
