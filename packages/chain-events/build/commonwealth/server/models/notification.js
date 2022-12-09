"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const Notification = sequelize.define('Notification', {
        id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        notification_data: { type: dataTypes.TEXT, allowNull: false },
        chain_event_id: { type: dataTypes.INTEGER, allowNull: true },
        chain_id: { type: dataTypes.STRING, allowNull: true },
        category_id: { type: dataTypes.STRING, allowNull: false }
    }, {
        tableName: 'Notifications',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ fields: ['chain_event_id'], prefix: 'new' }],
    });
    Notification.associate = (models) => {
        models.Notification.hasMany(models.NotificationsRead, { foreignKey: 'notification_id', onDelete: 'cascade', hooks: true });
        models.Notification.belongsTo(models.NotificationCategory, { foreignKey: 'category_id', targetKey: 'name' });
        models.Notification.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
    };
    return Notification;
};
