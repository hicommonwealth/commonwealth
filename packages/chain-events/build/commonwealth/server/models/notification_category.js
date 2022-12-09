"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (sequelize, dataTypes) => {
    const NotificationCategory = sequelize.define('NotificationCategory', {
        name: { type: dataTypes.STRING, primaryKey: true },
        description: { type: dataTypes.TEXT, allowNull: false },
    }, {
        tableName: 'NotificationCategories',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
    NotificationCategory.associate = (models) => {
        models.NotificationCategory.hasMany(models.Notification, { foreignKey: 'category_id' });
        models.NotificationCategory.hasMany(models.Subscription, { foreignKey: 'category_id' });
    };
    return NotificationCategory;
};
