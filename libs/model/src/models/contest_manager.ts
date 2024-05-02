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
        allowNull: true,
      },
      funding_token_address: { type: Sequelize.STRING },
      prize_percentage: { type: Sequelize.INTEGER },
      payout_structure: { type: Sequelize.ARRAY(Sequelize.INTEGER) },
      interval: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      ticker: { type: Sequelize.STRING },
      decimals: { type: Sequelize.INTEGER },
      created_at: { type: Sequelize.DATE, allowNull: false },
      cancelled: { type: Sequelize.BOOLEAN },
    },
    {
      tableName: 'ContestManagers',
      timestamps: false,
      indexes: [],
    },
  );
