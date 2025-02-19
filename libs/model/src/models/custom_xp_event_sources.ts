import { CustomXpEventSource } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ModelInstance } from './types';

export type CustomXpEventSourceAttributes = z.infer<typeof CustomXpEventSource>;

export type CustomXpEventSourceInstance =
  ModelInstance<CustomXpEventSourceAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CustomXpEventSourceInstance> =>
  sequelize.define<CustomXpEventSourceInstance>(
    'CustomXpEventSource',
    {
      chain_node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'ChainNodes', key: 'id' },
      },
      contract_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      event_signature: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      quest_action_meta_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'QuestionActionMetas', key: 'id' },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'CustomXpEventSources',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
