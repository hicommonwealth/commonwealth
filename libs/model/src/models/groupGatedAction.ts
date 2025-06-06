import { GroupGatedAction } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod/v4';
import { GroupAttributes } from './group';
import { TopicAttributes } from './topic';
import type { ModelInstance } from './types';

export type GroupGatedActionsAttributes = z.infer<typeof GroupGatedAction> & {
  // associations
  Group?: GroupAttributes;
  Topic?: TopicAttributes;
};

export type GroupGatedActionsInstance =
  ModelInstance<GroupGatedActionsAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<GroupGatedActionsInstance> =>
  sequelize.define<GroupGatedActionsInstance>(
    'GroupGatedAction',
    {
      group_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      topic_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      is_private: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      gated_actions: {
        // This needs to be a string[] because enum[] will break sequelize.sync and fail tests
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
      },
    },
    {
      tableName: 'GroupGatedActions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['is_private', 'topic_id'] }],
    },
  );
