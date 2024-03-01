module.exports = (sequelize, DataTypes) => {
  const holidayCalender = sequelize.define(
    'holidayCalender',
    {
      holiday: DataTypes.STRING,
      date: DataTypes.STRING,
    },
    {
      tableName: 'holiday_calender',
      updatedAt: false,
    },
  )
  return holidayCalender
}
