import { ThreadSubscription } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { ModelInstance } from './types';

export type ThreadSubscriptionAttributes = z.infer<typeof ThreadSubscription>;

export type ThreadSubscriptionInstance =
  ModelInstance<ThreadSubscriptionAttributes>;

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
      // FIXME: I'm not sure how to define the relationship with the 'Thread' here
      // I tried to import the sequalize.define() for 'Thread' from ./thread.ts
      // and use that here but that didn't work. I thought maybe I had to update
      // ThreadSubscriptions to pull in the full object but that didn't work either.
      // I went through all the code examples of sequelize.define in our repo
      // and didn't find any way to join on an object (maybe I missed it).
      //Thread
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
