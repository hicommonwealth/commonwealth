import { projections } from '@hicommonwealth/shared';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type ContestAction = ModelInstance<z.infer<typeof projections.ContestAction>>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<ContestAction>>sequelize.define<ContestAction>(
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
        type: Sequelize.ENUM(...projections.CONTEST_ACTIONS),
        primaryKey: true,
      },
      content_url: {
        type: Sequelize.STRING,
      },
      thread_id: { type: Sequelize.INTEGER },
      voting_power: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ContestActions',
      timestamps: false,
      indexes: [],
    },
  );
