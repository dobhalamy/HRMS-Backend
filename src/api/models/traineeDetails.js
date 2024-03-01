module.exports = (sequelize, DataTypes) => {
  const Trainee = sequelize.define(
    'Trainee',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
      },
      trainerId: {
        type: DataTypes.INTEGER,
      },
      traineeJoiningDate: DataTypes.DATE,
      trainingHandoverDate: DataTypes.DATE,
      trainingStartDate: DataTypes.DATE,
      trainingEndDate: DataTypes.DATE,
      certificationDate: {
        type: DataTypes.DATE,
        defaultValue: null,
      },
      certificationStatus: DataTypes.STRING,
      reCertificationDate: DataTypes.DATE,
      reCertificationStatus: DataTypes.STRING,
      handoverDateToOps: DataTypes.DATE,
      managerId: DataTypes.INTEGER,
      amId: DataTypes.INTEGER,
      tlId: DataTypes.INTEGER,
      status: DataTypes.INTEGER,
      isCompleted: DataTypes.INTEGER,
      retraining: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      tableName: 'traineedetails',
    },
  )
  return Trainee
}
