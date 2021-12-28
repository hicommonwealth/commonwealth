import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';

export interface NotificationCategoryAttributes {
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface NotificationCategoryInstance
extends Model<NotificationCategoryAttributes>, NotificationCategoryAttributes {}

export type NotificationCategoryModelStatic = ModelStatic<NotificationCategoryInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): NotificationCategoryModelStatic => {
  const NotificationCategory = <NotificationCategoryModelStatic>sequelize.define('NotificationCategory', {
    name: { type: dataTypes.STRING, primaryKey: true },
    description: { type: dataTypes.TEXT, allowNull: false },
  }, {
    tableName: 'NotificationCategories',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  NotificationCategory.associate = (models) => {
    models.NotificationCategory.hasMany(models.Notification, {foreignKey: 'category_id'});
    models.NotificationCategory.hasMany(models.Subscription, {foreignKey: 'category_id'})
  }
  return NotificationCategory;
};
