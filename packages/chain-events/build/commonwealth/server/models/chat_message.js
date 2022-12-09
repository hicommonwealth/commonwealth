"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const ChatMessage = sequelize.define('ChatMessage', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: dataTypes.STRING, allowNull: false },
        message: { type: dataTypes.TEXT, allowNull: false },
        chat_channel_id: { type: dataTypes.INTEGER, allowNull: false },
    }, {
        tableName: 'ChatMessages',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
    });
    ChatMessage.associate = (models) => {
        models.ChatMessage.belongsTo(models.ChatChannel);
    };
    return ChatMessage;
};
