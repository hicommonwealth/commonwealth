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
      // https://github.com/sequelize/sequelize/issues/10440
      // https://github.com/sequelize/sequelize/issues/8019#issuecomment-1280853048
      // Decimals are a PITA -- the below type will return a number if used with models.sync
      // but the migration: 20240108174142-community-stake.js ensures that a string is
      // returned since the DECIMAL type is used instead. Switching to DECIMAL here does
      // nothing
      vote_weight: { type: dataTypes.REAL, allowNull: false },
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
