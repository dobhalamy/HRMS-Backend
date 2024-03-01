const MessageTag = require('../../enums/messageNums')

module.exports = (sequelize, DataTypes) => {
  const ClientInformation = sequelize.define(
    'ClientInformation',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          arg: true,
          msg: MessageTag.ALREADY_TAKEN,
        },
        required: true,
      },
      businessAddress: { type: DataTypes.STRING, required: true, allowNull: false },
      businessPhoneNumber: { type: DataTypes.STRING, required: true, allowNull: false },
      businessEmail: { type: DataTypes.STRING, required: true, allowNull: false },
      contactPersonName: { type: DataTypes.STRING, required: true, allowNull: false },
      contactPersonEmail: { type: DataTypes.STRING, required: true, allowNull: false },
      clientMobileNumber: { type: DataTypes.STRING }, 
      // contantPersonDesignation: { type: DataTypes.STRING, required: true, allowNull: false },
      contactPersonDesignation: DataTypes.STRING,
      businessNature: DataTypes.STRING,
      servicesOffered: DataTypes.STRING,
      marketSegment: DataTypes.STRING,
      establishedYear: DataTypes.DATE,
      employeeCount: DataTypes.INTEGER,
      annualRevenue: DataTypes.STRING,
      keyCompetitors: DataTypes.STRING,
      missionValues: DataTypes.STRING,
      advertisingStrategies: DataTypes.STRING,
      socialMediaPresence: DataTypes.STRING,
      websitePresence: DataTypes.STRING,
      legalCompliance: DataTypes.TEXT,
      businessStructure: DataTypes.STRING,
      createdBy: DataTypes.INTEGER,
      createdAt: DataTypes.DATE,
      updatedBy: DataTypes.INTEGER,
      updatedAt: DataTypes.DATE,
    },
    { tableName: 'client_information' },
  )
  return ClientInformation
}
