import { ThreadSubscription } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ThreadSubscriptionAttributes = z.infer<
  typeof ThreadSubscription
> & {
  // associations
  Thread?: any;
};

export type ThreadSubscriptionInstance =
  ModelInstance<ThreadSubscriptionAttributes> & {
    // no mixins used
  };

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ThreadSubscriptionInstance> =>
  sequelize.define<ThreadSubscriptionInstance>(
    'ThreadSubscriptions',
    {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      thread_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
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
          fields: ['thread_id'],
        },
      ],
    },
  );
