import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

export interface NotificationCategoryAttributes {
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface NotificationCategoryInstance
extends Model<NotificationCategoryAttributes>, NotificationCategoryAttributes {}


type NotificationCategoryModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): NotificationCategoryInstance }

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
