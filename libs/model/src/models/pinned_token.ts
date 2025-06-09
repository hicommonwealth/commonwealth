import { PinnedToken } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { CommunityAttributes } from './community';
import type { ModelInstance } from './types';

export type PinnedTokenAttributes = z.infer<typeof PinnedToken> & {
  Community?: CommunityAttributes;
};

export type PinnedTokenInstance = ModelInstance<PinnedTokenAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<PinnedTokenInstance> =>
  sequelize.define<PinnedTokenInstance>(
    'PinnedToken',
    {
      community_id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      contract_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      chain_node_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      has_pricing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      tableName: 'PinnedTokens',
    },
  );
