"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const SocialAccount = sequelize.define('SocialAccount', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        provider: { type: dataTypes.STRING },
        provider_username: { type: dataTypes.STRING },
        provider_userid: { type: dataTypes.STRING },
        access_token: { type: dataTypes.STRING },
        refresh_token: { type: dataTypes.STRING },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'SocialAccounts',
        underscored: true,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['user_id', 'provider'] },
        ],
    });
    SocialAccount.associate = (models) => {
        models.SocialAccount.belongsTo(models.User);
    };
    return SocialAccount;
};
