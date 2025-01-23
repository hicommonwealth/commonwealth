import { CommunityIndexer } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

export type CommunityIndexerAttributes = z.infer<typeof CommunityIndexer>;

export type CommunityIndexerInstance =
  ModelInstance<CommunityIndexerAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommunityIndexerInstance> =>
  sequelize.define<CommunityIndexerInstance>(
    'CommunityIndexer',
    {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_checked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'CommunityIndexers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
