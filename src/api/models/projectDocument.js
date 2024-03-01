module.exports = (sequelize, DataTypes) => {
    const ProjectsDocuments = sequelize.define(
      'ProjectsDocuments',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        projectId: { type: DataTypes.INTEGER, required: true, allowNull: false },
        mediaType: { type: DataTypes.STRING, required: true, allowNull: true },
        mediaLink: { type: DataTypes.STRING, required: true, allowNull: true },
        description: { type: DataTypes.STRING, required: true, allowNull: true },
        isActive: DataTypes.TINYINT,
        createdBy: DataTypes.INTEGER,
        createdAt: DataTypes.DATE,
        updatedBy: DataTypes.INTEGER,
        updatedAt: DataTypes.DATE,
      },
      { tableName: 'project_document' },
    )
    return ProjectsDocuments
  }