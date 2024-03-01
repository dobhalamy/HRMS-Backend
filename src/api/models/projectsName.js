module.exports = (sequelize, DataTypes) => {
  const ProjectsName = sequelize.define(
    "projectsName",
    {
      projectId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      projectName: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      createdBy: DataTypes.INTEGER,
      updatedAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
    },
    {
      tableName: "projects_name",
    }
  );
  return ProjectsName;
};
