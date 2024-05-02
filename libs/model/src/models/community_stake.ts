import { entities } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import { CommunityAttributes } from './community';
import type { ModelInstance, ModelStatic } from './types';

export type CommunityStakeAttributes = z.infer<
  typeof entities.CommunityStake
> & {
  // associations
  Community?: CommunityAttributes;
};

export type CommunityStakeInstance = ModelInstance<CommunityStakeAttributes>;

export type CommunityStakeModelStatic = ModelStatic<CommunityStakeInstance>;

export default (sequelize: Sequelize.Sequelize): CommunityStakeModelStatic =>
  <CommunityStakeModelStatic>sequelize.define<CommunityStakeInstance>(
    'CommunityStakes',
    {
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      stake_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      stake_token: { type: Sequelize.STRING, allowNull: false },
      vote_weight: { type: Sequelize.INTEGER, allowNull: false },
      stake_enabled: { type: Sequelize.BOOLEAN, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
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
