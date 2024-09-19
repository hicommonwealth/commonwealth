import { ContestTopic as ContestTopicSchema } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import type { ModelInstance } from './types';

type ContestTopicAttributes = z.infer<typeof ContestTopicSchema>;
type ContestTopic = ModelInstance<ContestTopicAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ContestTopic> =>
  sequelize.define<ContestTopic>(
    'ContestTopic',
    {
      contest_address: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },
      topic_id: { type: Sequelize.INTEGER, primaryKey: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ContestTopics',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['contest_address'],
          name: 'contest_address_unique',
        },
      ],
    },
  );
