import { entities } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance, ModelStatic } from './types';

type ContestTopic = ModelInstance<z.infer<typeof entities.ContestTopic>>;

export default (sequelize: Sequelize.Sequelize) =>
  <ModelStatic<ContestTopic>>sequelize.define<ContestTopic>(
    'ContestTopic',
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
    },
  );
