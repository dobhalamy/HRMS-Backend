module.exports = (sequelize, DataTypes) => {
  const Roster = sequelize.define(
    'Roster',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      empId: DataTypes.STRING,
      shiftTimings: DataTypes.TEXT,
      month: DataTypes.STRING,
      year: DataTypes.STRING,
      type: DataTypes.STRING,
      workFrom: DataTypes.STRING,
      empStage: DataTypes.STRING,
      gender: DataTypes.STRING,
      process: DataTypes.TEXT,
      subProcess: DataTypes.STRING,
      createdBy: DataTypes.STRING,
      createdAt: DataTypes.DATE,
    },
    {
      tableName: 'roster_upload',
    },
  )
  return Roster
}
