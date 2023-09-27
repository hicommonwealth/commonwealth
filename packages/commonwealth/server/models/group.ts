import type * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ChainAttributes } from './chain';
import { ModelInstance, ModelStatic } from './types';
import { Requirement } from '../util/requirementsModule/requirementsTypes';

export type GroupMetadata = {
  name: string;
  description: string;
  required_requirements: number;
  membership_ttl: number;
};

export type GroupAttributes = {
  id: number;
  chain_id: string;
  metadata: GroupMetadata;
  requirements: Requirement[];

  created_at?: Date;
  updated_at?: Date;

  // associations
  Chain?: ChainAttributes;
};

export type GroupInstance = ModelInstance<GroupAttributes>;
export type GroupModelStatic = ModelStatic<GroupInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): GroupModelStatic => {
  const Group = <GroupModelStatic>sequelize.define(
    'Group',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chain_id: { type: dataTypes.STRING, allowNull: false },
      metadata: { type: dataTypes.JSON, allowNull: false },
      requirements: { type: dataTypes.JSON, allowNull: false },

      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'Groups',
      indexes: [{ fields: ['chain_id'] }],
    }
  );

  Group.associate = (models) => {
    models.Group.belongsTo(models.Chain, {
      foreignKey: 'chain_id',
      targetKey: 'id',
    });
    models.Group.hasMany(models.Membership, {
      foreignKey: 'group_id',
      as: 'memberships',
    });
  };

  return Group;
};
