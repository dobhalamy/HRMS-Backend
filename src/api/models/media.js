module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define(
    'media',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      mediaType: DataTypes.STRING,
      mediaName: {
        type: DataTypes.STRING,
        required: true,
      },
      empId: {
        type: DataTypes.STRING,
        defaultValue: 0,
      },
      mediaLink: {
        type: DataTypes.STRING,
        required: true,
      },
      mediaExtension: DataTypes.STRING,
      isActive: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      createdBy: DataTypes.INTEGER,
      createdAt: {
        type: DataTypes.DATE,
        required: true,
      },
      updatedAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
    },
    {
      tableName: 'media',
      updatedAt: false,
    },
  )
  return Media
}
