module.exports = (sequelize, DataTypes) => {
  const RYGstatus = sequelize.define(
    'RYGstatus',
    {
      empId: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subStatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      remarks: DataTypes.TEXT,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      tableName: 'ryg_status',
    },
  )
  return RYGstatus
}
