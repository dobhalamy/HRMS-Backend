module.exports = (sequelize, DataTypes) => {
  const ProjectInformation = sequelize.define(
    'ProjectInformation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: { type: DataTypes.INTEGER, required: true, allowNull: false },
      projectId: { type: DataTypes.STRING, required: true, allowNull: false },
      projectName: { type: DataTypes.STRING, required: true, allowNull: false },
      billingType: { type: DataTypes.STRING, required: true, allowNull: false },
      projectSource: DataTypes.TEXT,
      projectStatus:  DataTypes.INTEGER,
      technology: { type: DataTypes.STRING },
      projectStartDate: { type: DataTypes.DATE, required: true, allowNull: false },
      projectEndDate: DataTypes.DATE,
      description: DataTypes.TEXT,
      createdBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
      updatedAt: DataTypes.DATE,
    },
    { tableName: 'project_information' },
  )
  return ProjectInformation
}
