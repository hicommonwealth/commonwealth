import { GroupPermission, permissionEnum } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import { GroupAttributes } from './group';
import type { ModelInstance } from './types';

export type GroupPermissionAttributes = z.infer<typeof GroupPermission> & {
  // associations
  Group?: GroupAttributes;
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
      type: {
        type: Sequelize.ENUM(...permissionEnum),
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      tableName: 'GroupPermissions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
