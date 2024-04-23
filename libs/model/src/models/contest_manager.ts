import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type ContestManager = ModelInstance<
  z.infer<typeof schemas.entities.ContestManager>
>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<ContestManager>>sequelize.define<ContestManager>(
    'ContestManager',
    {
      contest_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      community_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      funding_token_address: { type: Sequelize.STRING },
      prize_percentage: { type: Sequelize.DOUBLE },
      payout_structure: { type: Sequelize.ARRAY(Sequelize.DOUBLE) },
      interval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      paused: { type: Sequelize.BOOLEAN },
    },
    {
      tableName: 'ContestManagers',
      timestamps: false,
      indexes: [],
    },
  );
