import { TopicSubscription } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod/v4';
import type { TopicAttributes } from './topic';
import type { ModelInstance } from './types';

export type TopicSubscriptionAttributes = z.infer<typeof TopicSubscription> & {
  topic?: TopicAttributes;
};

export type TopicSubscriptionInstance =
  ModelInstance<TopicSubscriptionAttributes> & {
    // no mixins used
  };

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<TopicSubscriptionInstance> =>
  sequelize.define<TopicSubscriptionInstance>(
    'TopicSubscriptions',
    {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      topic_id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
    },
    {
      tableName: 'TopicSubscriptions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
      indexes: [
        {
          fields: ['topic_id'],
        },
      ],
    },
  );
