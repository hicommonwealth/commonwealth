"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const RoleAssignment = sequelize.define('RoleAssignment', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        community_role_id: { type: dataTypes.INTEGER, allowNull: false },
        address_id: { type: dataTypes.INTEGER, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
        is_user_default: {
            type: dataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'RoleAssignments',
        underscored: true,
        indexes: [{ fields: ['community_role_id'] }, { fields: ['address_id'] }],
    });
    RoleAssignment.associate = (models) => {
        models.RoleAssignment.belongsTo(models.CommunityRole, {
            foreignKey: 'community_role_id',
            targetKey: 'id',
        });
        models.RoleAssignment.belongsTo(models.Address, {
            foreignKey: 'address_id',
            targetKey: 'id',
        });
    };
    return RoleAssignment;
};
