"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Address = sequelize.define('Address', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        address: { type: dataTypes.STRING, allowNull: false },
        chain: { type: dataTypes.STRING, allowNull: false },
        verification_token: { type: dataTypes.STRING, allowNull: false },
        verification_token_expires: { type: dataTypes.DATE, allowNull: true },
        verified: { type: dataTypes.DATE, allowNull: true },
        keytype: { type: dataTypes.STRING, allowNull: true },
        name: { type: dataTypes.STRING, allowNull: true },
        last_active: { type: dataTypes.DATE, allowNull: true },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
        user_id: { type: dataTypes.INTEGER, allowNull: true },
        is_councillor: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        is_validator: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        ghost_address: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        profile_id: { type: dataTypes.INTEGER, allowNull: true },
        wallet_id: { type: dataTypes.STRING, allowNull: true },
        block_info: { type: dataTypes.STRING, allowNull: true },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        tableName: 'Addresses',
        indexes: [
            { fields: ['address', 'chain'], unique: true },
            { fields: ['user_id'] },
            { fields: ['name'] }
        ],
        defaultScope: {
            attributes: {
                exclude: ['verification_token', 'verification_token_expires', 'block_info', 'created_at', 'updated_at'],
            }
        },
        scopes: {
            withPrivateData: {}
        },
    });
    Address.associate = (models) => {
        models.Address.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
        models.Address.belongsTo(models.Profile, { foreignKey: 'profile_id', targetKey: 'id' });
        models.Address.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
        models.Address.hasOne(models.OffchainProfile);
        models.Address.hasOne(models.SsoToken);
        models.Address.hasMany(models.RoleAssignment, { foreignKey: 'address_id' });
        models.Address.belongsToMany(models.Thread, {
            through: models.Collaboration,
            as: 'collaboration'
        });
        models.Address.hasMany(models.Collaboration);
    };
    return Address;
};
