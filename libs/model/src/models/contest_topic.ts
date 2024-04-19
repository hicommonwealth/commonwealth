import { schemas } from '@hicommonwealth/core';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';
import { syncHooks } from './utils';

type ContestTopic = ModelInstance<
  z.infer<typeof schemas.projections.ContestTopic>
>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<ContestTopic>>sequelize.define<ContestTopic>(
    'ContestAction',
    {
      contest_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      topic_id: { type: Sequelize.INTEGER, primaryKey: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ContestTopics',
      timestamps: false,
      indexes: [],
      hooks: syncHooks,
    },
  );
