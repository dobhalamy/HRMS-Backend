module.exports = (sequelize, DataTypes) => {
  const GlobalType = sequelize.define(
    'GlobalType',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uniqueValue: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      displayName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      globalTypeCategory_uniqeValue: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isActive: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      isDeleted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'globaltypes',
    },
  )
  return GlobalType
}
