import { entities } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import z from 'zod';
import type { CommunityAttributes } from './community';
import type { MembershipAttributes } from './membership';
import type { ModelInstance, ModelStatic } from './types';

export type GroupAttributes = z.infer<typeof entities.Group> & {
  // associations
  community?: CommunityAttributes;
  memberships?: MembershipAttributes[];
};

export type GroupInstance = ModelInstance<GroupAttributes>;
export type GroupModelStatic = ModelStatic<GroupInstance>;

export default (sequelize: Sequelize.Sequelize) =>
  <GroupModelStatic>sequelize.define<GroupInstance>(
    'Group',
    {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: Sequelize.STRING, allowNull: false },
      metadata: { type: Sequelize.JSON, allowNull: false },
      requirements: { type: Sequelize.JSON, allowNull: false },
      is_system_managed: { type: Sequelize.BOOLEAN, allowNull: false },

      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Groups',
      indexes: [{ fields: ['community_id'] }],
    },
  );
