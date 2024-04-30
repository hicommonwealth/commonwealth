import type * as Sequelize from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

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

export default (sequelize: Sequelize.Sequelize) =>
  <NotificationCategoryModelStatic>(
    sequelize.define<NotificationCategoryInstance>(
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
