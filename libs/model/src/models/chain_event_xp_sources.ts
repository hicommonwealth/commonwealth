import { ChainEventXpSource } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod/v4';
import { ModelInstance } from './types';

export type ChainEventXpSourceAttributes = z.infer<typeof ChainEventXpSource>;

export type ChainEventXpSourceInstance =
  ModelInstance<ChainEventXpSourceAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<ChainEventXpSourceInstance> =>
  sequelize.define<ChainEventXpSourceInstance>(
    'ChainEventXpSource',
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
      readable_signature: { type: Sequelize.STRING, allowNull: false },
      transaction_hash: { type: Sequelize.STRING, allowNull: false },
      quest_action_meta_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      active: { type: Sequelize.BOOLEAN, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    },
    {
      tableName: 'ChainEventXpSources',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  );
