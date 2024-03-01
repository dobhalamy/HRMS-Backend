module.exports = (sequelize, DataTypes) => {
  const EmployeeLeave = sequelize.define(
    'MailTemplate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      content: DataTypes.TEXT,
      uniqueValue: DataTypes.INTEGER,
      isActive: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      tableName: 'mail_templates',
    },
  )
  return EmployeeLeave
}
