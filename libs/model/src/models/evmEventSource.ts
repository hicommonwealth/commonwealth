import { EvmEventSource } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize';
import { z } from 'zod';
import { ModelInstance } from './types';

export type EvmEventSourceAttributes = z.infer<typeof EvmEventSource>;

export type EvmEventSourceInstance = ModelInstance<EvmEventSourceAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<EvmEventSourceInstance> =>
  sequelize.define(
    'EvmEventSource',
    {
      eth_chain_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
      },
      contract_address: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      event_signature: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      contract_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      parent_contract_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at_block: { type: Sequelize.INTEGER, allowNull: false },
      events_migrated: { type: Sequelize.BOOLEAN, allowNull: false },
    },
    {
      tableName: 'EvmEventSources',
      timestamps: false,
    },
  );
