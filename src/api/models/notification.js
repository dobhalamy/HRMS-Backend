module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      userId: {
        type: DataTypes.INTEGER,
        required: true,
        allowNull: false,
      },
      notification: DataTypes.STRING,
      markAsRead: DataTypes.TINYINT,
      createdBy: DataTypes.INTEGER,
      createdAt: {
        type: DataTypes.DATE,
        required: true,
      },
    },
    {
      tableName: 'notification',
      updatedAt: false,
    },
  )
  return Notification
}
