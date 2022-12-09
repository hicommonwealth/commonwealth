"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const CommunityRole = sequelize.define('CommunityRole', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        name: {
            type: dataTypes.ENUM,
            values: ['admin', 'moderator', 'member'],
            defaultValue: 'member',
            allowNull: false,
        },
        allow: {
            type: dataTypes.BIGINT,
            defaultValue: 0,
            allowNull: false,
        },
        deny: {
            type: dataTypes.BIGINT,
            defaultValue: 0,
            allowNull: false,
        },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        tableName: 'CommunityRoles',
        underscored: true,
        indexes: [{ fields: ['chain_id'] }],
    });
    CommunityRole.associate = (models) => {
        models.CommunityRole.hasMany(models.RoleAssignment, {
            foreignKey: 'community_role_id',
        });
        models.CommunityRole.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    };
    return CommunityRole;
};
