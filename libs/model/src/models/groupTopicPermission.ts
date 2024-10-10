import { GroupTopicPermission } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { GroupAttributes } from './group';
import { TopicAttributes } from './topic';
import type { ModelInstance } from './types';

export type GroupTopicPermissionAttributes = z.infer<
  typeof GroupTopicPermission
> & {
  // associations
  Group?: GroupAttributes;
  Topic?: TopicAttributes;
};

export type GroupTopicPermissionInstance =
  ModelInstance<GroupTopicPermissionAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<GroupTopicPermissionInstance> =>
  sequelize.define<GroupTopicPermissionInstance>(
    'GroupTopicPermission',
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
      allowed_actions: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'GroupTopicPermissions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
