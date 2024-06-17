import Sequelize from 'sequelize';
import type { ModelInstance } from './types';

export type NotificationCategoryAttributes = {
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
};

export type NotificationCategoryInstance =
  ModelInstance<NotificationCategoryAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<NotificationCategoryInstance> =>
  sequelize.define<NotificationCategoryInstance>(
    'NotificationCategory',
    {
      name: { type: Sequelize.STRING, primaryKey: true },
      description: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
    },
    {
      tableName: 'NotificationCategories',
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
