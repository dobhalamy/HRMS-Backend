module.exports = (sequelize, DataTypes) => {
    const EmpLeaveDays = sequelize.define(
        "EmployeeLeaveDays",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: DataTypes.INTEGER,
            date: DataTypes.STRING,
            isPaid: DataTypes.TINYINT, 
            leaveId: DataTypes.INTEGER,
            createdAt: DataTypes.DATE,
            updatedAt: DataTypes.DATE,
        },
        {
            tableName: 'emp_leave_days',   
        },
    )
    return EmpLeaveDays
} 
