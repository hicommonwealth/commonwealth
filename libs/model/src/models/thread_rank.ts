import { ThreadRank } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ModelInstance } from './types';

export type ThreadRankAttributes = z.infer<typeof ThreadRank>;
export type ThreadRankInstance = ModelInstance<ThreadRankAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ThreadRankInstance> =>
  sequelize.define<ThreadRankInstance>(
    'ThreadRank',
    {
      thread_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      community_rank: {
        type: Sequelize.BIGINT,
        allowNull: false,
        get() {
          const rank = this.getDataValue('community_rank') as unknown as string;
          return BigInt(rank);
        },
      },
      global_rank: {
        type: Sequelize.BIGINT,
        allowNull: false,
        get() {
          const rank = this.getDataValue('global_rank') as unknown as string;
          return BigInt(rank);
        },
      },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ThreadRanks',
      createdAt: false,
      updatedAt: 'updated_at',
    },
  );
