module.exports = (sequelize, DataTypes) => {
  const GlobalType = sequelize.define(
    'GlobalTypeMapping',
    {
      globalTypeId: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      globalTypeCategoryId: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      tableName: 'global_type_parent_child_mapping',
    },
  )
  return GlobalType
}
