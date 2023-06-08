import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type NotificationsReadMaxAttributes = {
  user_id: number;
  max_id: number
};

export type NotificationsReadMaxInstance =
  ModelInstance<NotificationsReadMaxAttributes>;

export type NotificationsReadMaxModelStatic =
  ModelStatic<NotificationsReadMaxInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): NotificationsReadMaxModelStatic => {
  const NotificationsReadMax = <NotificationsReadMaxModelStatic>sequelize.define(
    'NotificationsReadMax',
    {
      user_id: { type: dataTypes.INTEGER },
      max_id: { type: dataTypes.INTEGER },
    },
    {
      tableName: 'NotificationsReadMax',
      underscored: true,
      timestamps: false,
      indexes: [{ fields: ['user_id'] }],
    }
  );

  return NotificationsReadMax;
};
