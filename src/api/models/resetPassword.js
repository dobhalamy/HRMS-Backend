module.exports = (sequelize, DataTypes) => {
    const ResetPassword = sequelize.define(
        'ResetPassword',
        {
            email: {
                type: DataTypes.STRING,
                primaryKey: true,
            },
            token: DataTypes.STRING,
            expire_at: {
                type: 'TIMESTAMP',
            },
            created_at: {
                type: 'TIMESTAMP',
            }
        },
        {
            timestamps: false, 
            tableName : 'password_resets',
        },
    ) 
    return ResetPassword
}