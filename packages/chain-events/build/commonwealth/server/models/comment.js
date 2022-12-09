"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Comment = sequelize.define('Comment', {
        id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        chain: { type: dataTypes.STRING, allowNull: false },
        root_id: { type: dataTypes.STRING, allowNull: false },
        parent_id: { type: dataTypes.STRING, allowNull: true },
        address_id: { type: dataTypes.INTEGER, allowNull: false },
        text: { type: dataTypes.TEXT, allowNull: false },
        plaintext: { type: dataTypes.TEXT, allowNull: true },
        version_history: { type: dataTypes.ARRAY(dataTypes.TEXT), defaultValue: [], allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: false },
        updated_at: { type: dataTypes.DATE, allowNull: false },
        deleted_at: { type: dataTypes.DATE, allowNull: true },
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        tableName: 'Comments',
        underscored: true,
        paranoid: true,
        indexes: [
            { fields: ['id'] },
            { fields: ['chain', 'root_id'] },
            { fields: ['address_id'] },
            { fields: ['chain', 'created_at'] },
            { fields: ['chain', 'updated_at'] },
            { fields: ['root_id'] },
        ],
    });
    Comment.associate = (models) => {
        models.Comment.belongsTo(models.Chain, {
            foreignKey: 'chain',
            targetKey: 'id'
        });
        models.Comment.belongsTo(models.Address, {
            foreignKey: 'address_id',
            targetKey: 'id'
        });
        models.Comment.hasMany(models.Attachment, {
            foreignKey: 'attachment_id',
            constraints: false,
            scope: {
                attachable: 'comment',
            },
        });
        models.Comment.hasMany(models.Reaction, {
            foreignKey: 'comment_id',
            as: 'reactions'
        });
    };
    return Comment;
};
