import type * as Sequelize from 'sequelize';
import type { DataTypes, ModelInstance, ModelStatic } from './types';

export type NotificationCategoryAttributes = {
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
};

export type NotificationCategoryInstance =
  ModelInstance<NotificationCategoryAttributes>;

export type NotificationCategoryModelStatic =
  ModelStatic<NotificationCategoryInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: DataTypes,
): NotificationCategoryModelStatic => {
  const NotificationCategory = <NotificationCategoryModelStatic>(
    sequelize.define(
      'NotificationCategory',
      {
        name: { type: dataTypes.STRING, primaryKey: true },
        description: { type: dataTypes.TEXT, allowNull: false },
        created_at: { type: dataTypes.DATE, allowNull: true },
        updated_at: { type: dataTypes.DATE, allowNull: true },
      },
      {
        tableName: 'NotificationCategories',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    )
  );
  NotificationCategory.associate = (models) => {
    models.NotificationCategory.hasMany(models.Notification, {
      foreignKey: 'category_id',
    });
    models.NotificationCategory.hasMany(models.Subscription, {
      foreignKey: 'category_id',
    });
  };
  return NotificationCategory;
};
