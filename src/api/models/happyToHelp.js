module.exports = (sequelize, DataTypes) => {
  const happyToHelp = sequelize.define(
    'happyToHelp',
    {
      belongsTo: DataTypes.STRING,
      issue: DataTypes.STRING,
      communicationWith: DataTypes.STRING,
      mobileNo: DataTypes.STRING,
      concernOf: DataTypes.DATE,
      remark: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      createdBy: DataTypes.INTEGER,
      updatedAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      tableName: 'happy_to_help',
      updatedAt: false,
    },
  )
  return happyToHelp
}
