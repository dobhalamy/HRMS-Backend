module.exports = (sequelize, DataTypes) => {
  const EmployeeLeave = sequelize.define(
    "Events",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      eventName: DataTypes.STRING,
      eventStartDate: DataTypes.DATE,
      eventEndDate: DataTypes.DATE,
      eventDesc: DataTypes.STRING,
      eventCategory: DataTypes.STRING,
      isActive: DataTypes.INTEGER,
      createdBy: DataTypes.INTEGER,
      updatedBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      tableName: "events",
    }
  );
  return EmployeeLeave;
};
