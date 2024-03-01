module.exports = (sequelize, DataTypes) => {
  const RolePermissions = sequelize.define(
    'RolePermissions',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      moduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      depId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      permissions: { type: DataTypes.TEXT('long') },
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      tableName: 'role_permissions',
    },
  )
  return RolePermissions
}
