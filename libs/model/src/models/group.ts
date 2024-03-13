import { group } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import z from 'zod';
import { CommunityAttributes } from './community';
import { ModelInstance, ModelStatic } from './types';

export type GroupAttributes = z.infer<typeof group.Group> & {
  // associations
  community?: CommunityAttributes;
};

export type GroupInstance = ModelInstance<GroupAttributes>;
export type GroupModelStatic = ModelStatic<GroupInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): GroupModelStatic => {
  const Group = <GroupModelStatic>sequelize.define(
    'Group',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      community_id: { type: dataTypes.STRING, allowNull: false },
      metadata: { type: dataTypes.JSON, allowNull: false },
      requirements: { type: dataTypes.JSON, allowNull: false },
      is_system_managed: { type: dataTypes.BOOLEAN, allowNull: false },

      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
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

  Group.associate = (models) => {
    models.Group.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
    models.Group.hasMany(models.Membership, {
      foreignKey: 'group_id',
      as: 'memberships',
    });
  };

  return Group;
};
