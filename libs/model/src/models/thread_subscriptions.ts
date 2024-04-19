import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

export type ThreadSubscriptionAttributes = z.infer<
  typeof schemas.entities.ThreadSubscriptions
>;

export type ThreadSubscriptionInstance =
  ModelInstance<ThreadSubscriptionAttributes>;

export type ThreadSubscriptionModelStatic =
  ModelStatic<ThreadSubscriptionInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ThreadSubscriptionModelStatic => {
  const ThreadSubscription = <ThreadSubscriptionModelStatic>(
    sequelize.define<ThreadSubscriptionInstance>(
      'ThreadSubscriptions',
      {
        id: {
          type: dataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: dataTypes.INTEGER,
          allowNull: false,
        },
        thread_id: {
          type: dataTypes.INTEGER,
          allowNull: false,
        },
        created_at: {
          type: dataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: dataTypes.DATE,
          allowNull: false,
          defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      {
        tableName: 'ThreadSubscriptions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        underscored: false,
        indexes: [
          {
            fields: ['user_id', 'thread_id'],
            unique: true,
          },
        ],
      },
    )
  );

  ThreadSubscription.associate = (models) => {
    models.ThreadSubscription.belongsTo(models.User, {
      foreignKey: 'user_id',
    });
    models.ThreadSubscription.belongsTo(models.Thread, {
      foreignKey: 'thread_id',
    });
  };
  return ThreadSubscription;
};
