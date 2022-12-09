"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Attachment = sequelize.define('Attachment', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        attachable: { type: dataTypes.STRING, allowNull: false },
        attachment_id: { type: dataTypes.INTEGER, allowNull: false },
        url: { type: dataTypes.TEXT, allowNull: false },
        description: { type: dataTypes.TEXT, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
    }, {
        tableName: 'Attachments',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['attachable', 'attachment_id'] },
        ],
    });
    Attachment.associate = (models) => {
        models.Attachment.belongsTo(models.Comment, {
            foreignKey: 'attachment_id',
            constraints: false,
            as: 'comment',
        });
        models.Attachment.belongsTo(models.Thread, {
            foreignKey: 'attachment_id',
            constraints: false,
            as: 'thread',
        });
    };
    return Attachment;
};
