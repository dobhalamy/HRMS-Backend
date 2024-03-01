module.exports = (sequelize, DataTypes) => {
  const ProjectsAssigned = sequelize.define(
    'ProjectsAssigned',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      projectId: { type: DataTypes.STRING, required: true, allowNull: false },
      empId: { type: DataTypes.STRING },
      employeeProjectRole: { type: DataTypes.STRING, required: true, allowNull: true },
      userId:  { type: DataTypes.INTEGER, required: true, allowNull: false },
      // projectName: { type: DataTypes.STRING, required: true, allowNull: false },
      createdBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
      updatedAt: DataTypes.DATE,
      isRemove: DataTypes.TINYINT,
      assignDate: DataTypes.DATE,
      unassignDate: DataTypes.DATE
    },
    { tableName: 'project_assigned' },
  )
  return ProjectsAssigned
}
