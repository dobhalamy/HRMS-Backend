module.exports = (sequalize, DataTypes) => {
  const DsrQuery = sequalize.define(
    'DsrQuery',
    {
      userId: DataTypes.INTEGER,
      dsrId: DataTypes.INTEGER,
      date: DataTypes.STRING,
      query: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      createdAt: {
        type: DataTypes.DATE,
        required: true,
      },
      updatedAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
    },
    {
      tableName: 'dsr_query',
      updatedAt: false,
    },
  )
  return DsrQuery
}
