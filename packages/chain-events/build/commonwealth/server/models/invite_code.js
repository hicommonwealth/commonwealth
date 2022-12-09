"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const InviteCode = sequelize.define('InviteCode', {
        id: { type: dataTypes.STRING, primaryKey: true },
        chain_id: { type: dataTypes.STRING, allowNull: false },
        community_name: { type: dataTypes.STRING, allowNull: true },
        creator_id: { type: dataTypes.INTEGER, allowNull: false },
        invited_email: { type: dataTypes.STRING, allowNull: true, defaultValue: null },
        used: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        tableName: 'InviteCodes',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true,
        indexes: [
            { fields: ['id'], unique: true },
            { fields: ['creator_id'] },
        ],
    });
    InviteCode.associate = (models) => {
        models.InviteCode.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    };
    return InviteCode;
};
