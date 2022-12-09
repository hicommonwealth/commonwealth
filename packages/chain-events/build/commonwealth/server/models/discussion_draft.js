"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports.default = (sequelize, dataTypes) => {
    const DiscussionDraft = sequelize.define('DiscussionDraft', {
        id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        address_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
        title: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        topic: { type: sequelize_1.DataTypes.STRING, allowNull: true },
        body: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
        chain: { type: sequelize_1.DataTypes.STRING, allowNull: false },
        attachment: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    }, {
        tableName: 'DiscussionDrafts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: true,
        indexes: [
            { fields: ['address_id'] },
        ],
    });
    DiscussionDraft.associate = (models) => {
        models.DiscussionDraft.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
        models.DiscussionDraft.belongsTo(models.Address, { foreignKey: 'address_id', targetKey: 'id' });
        models.DiscussionDraft.hasMany(models.Attachment, {
            foreignKey: 'attachment_id',
            constraints: false,
            scope: { attachable: 'thread' },
        });
    };
    return DiscussionDraft;
};
