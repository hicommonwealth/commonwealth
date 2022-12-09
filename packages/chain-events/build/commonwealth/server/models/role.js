"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Role = sequelize.define('Role', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        address_id: { type: dataTypes.INTEGER, allowNull: false },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        is_user_default: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        permission: {
            type: dataTypes.ENUM,
            values: ['admin', 'moderator', 'member'],
            defaultValue: 'member',
            allowNull: false,
        },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'Roles',
        underscored: true,
        indexes: [
            { fields: ['address_id'] },
            { fields: ['chain_id'] },
            { fields: ['address_id', 'chain_id'], unique: true },
        ],
    });
    Role.associate = (models) => {
        models.Role.belongsTo(models.Address, {
            foreignKey: 'address_id',
            targetKey: 'id',
        });
        models.Role.belongsTo(models.Chain, {
            foreignKey: 'chain_id',
            targetKey: 'id',
        });
    };
    return Role;
};
