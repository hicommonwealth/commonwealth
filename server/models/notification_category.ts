import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from '../../shared/types';

export interface NotificationCategoryAttributes {
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface NotificationCategoryInstance
extends Model<NotificationCategoryAttributes>, NotificationCategoryAttributes {}

type NotificationCategoryModelStatic = ModelStatic<NotificationCategoryInstance>

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
  });
  return NotificationCategory;
};
