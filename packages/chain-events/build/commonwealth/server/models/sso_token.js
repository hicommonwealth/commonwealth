"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const SsoToken = sequelize.define('SsoToken', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        issued_at: { type: dataTypes.INTEGER, allowNull: true },
        issuer: { type: dataTypes.STRING, allowNull: true },
        address_id: { type: dataTypes.INTEGER, allowNull: true },
        profile_id: { type: dataTypes.INTEGER, allowNull: true },
        state_id: { type: dataTypes.STRING, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'SsoTokens',
        underscored: true,
        timestamps: true,
        indexes: [
            { fields: ['id'] },
            { fields: ['issuer', 'address_id'] },
        ],
        defaultScope: {
            attributes: {
                exclude: ['issued_at', 'issuer', 'address_id', 'state_id', 'created_at', 'updated_at'],
            }
        },
        scopes: {
            withPrivateData: {}
        }
    });
    SsoToken.associate = (models) => {
        models.SsoToken.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
        models.SsoToken.belongsTo(models.Profile, { foreignKey: 'profile_id', targetKey: 'id' });
    };
    return SsoToken;
};
