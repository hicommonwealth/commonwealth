"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const NotificationsRead = sequelize.define('NotificationsRead', {
        id: { type: dataTypes.INTEGER },
        subscription_id: { type: dataTypes.INTEGER, primaryKey: true },
        notification_id: { type: dataTypes.INTEGER, primaryKey: true },
        is_read: { type: dataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        user_id: { type: dataTypes.INTEGER }
    }, {
        tableName: 'NotificationsRead',
        underscored: true,
        timestamps: false
    });
    NotificationsRead.associate = (models) => {
        models.NotificationsRead.belongsTo(models.Subscription, { foreignKey: 'subscription_id', targetKey: 'id' });
        models.NotificationsRead.belongsTo(models.Notification, { foreignKey: 'notification_id', targetKey: 'id' });
        models.NotificationsRead.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'id' });
    };
    return NotificationsRead;
};
