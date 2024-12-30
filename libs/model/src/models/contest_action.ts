import { CONTEST_ACTIONS, ContestAction } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ContestManagerAttributes } from './contest_manager';
import type { ModelInstance } from './types';

export type ContestActionAttributes = z.infer<typeof ContestAction> & {
  // associations
  ContestManager?: ContestManagerAttributes;
};

type ContestAction = ModelInstance<ContestActionAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ContestAction> =>
  sequelize.define<ContestAction>(
    'ContestAction',
    {
      contest_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      contest_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      content_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      actor_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      action: {
        type: Sequelize.ENUM(...CONTEST_ACTIONS),
        primaryKey: true,
      },
      content_url: {
        type: Sequelize.STRING,
      },
      thread_id: { type: Sequelize.INTEGER },
      voting_power: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: false,
      },
      calculated_voting_weight: {
        type: Sequelize.DECIMAL(78, 0),
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ContestActions',
      timestamps: false,
      indexes: [],
    },
  );
