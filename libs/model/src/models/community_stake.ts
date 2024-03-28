import { schemas } from '@hicommonwealth/core';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import { z } from 'zod';
import { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityStakeAttributes = z.infer<
  typeof schemas.entities.CommunityStake
> & {
  // associations
  Chain?: CommunityAttributes;
};

export type CommunityStakeInstance = ModelInstance<CommunityStakeAttributes>;

export type CommunityStakeModelStatic = ModelStatic<CommunityStakeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommunityStakeModelStatic => {
  const CommunityStake = <CommunityStakeModelStatic>sequelize.define(
    'CommunityStakes',
    {
      community_id: {
        type: dataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      stake_id: { type: dataTypes.INTEGER, allowNull: false, primaryKey: true },
      stake_token: { type: dataTypes.STRING, allowNull: false },
      vote_weight: { type: dataTypes.INTEGER, allowNull: true },
      stake_enabled: { type: dataTypes.BOOLEAN, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'CommunityStakes',
      indexes: [{ fields: ['community_id'] }, { fields: ['stake_id'] }],
    },
  );

  CommunityStake.associate = (models) => {
    models.CommunityStake.belongsTo(models.Community, {
      foreignKey: 'community_id',
      targetKey: 'id',
    });
  };

  return CommunityStake;
};
