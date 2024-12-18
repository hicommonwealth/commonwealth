import { GroupPermission } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import { GroupAttributes } from './group';
import { TopicAttributes } from './topic';
import type { ModelInstance } from './types';

export type GroupPermissionAttributes = z.infer<typeof GroupPermission> & {
  // associations
  Group?: GroupAttributes;
  Topic?: TopicAttributes;
};

export type GroupPermissionInstance = ModelInstance<GroupPermissionAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<GroupPermissionInstance> =>
  sequelize.define<GroupPermissionInstance>(
    'GroupPermission',
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
        // This needs to be a string[] because enum[] will break sequelize.sync and fail tests
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
      },
    },
    {
      tableName: 'GroupPermissions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
