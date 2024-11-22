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
        allowNull: false,
        primaryKey: true,
      },
      contract_address: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      event_signature: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      kind: { type: Sequelize.STRING, allowNull: false },
      created_at_block: { type: Sequelize.INTEGER, allowNull: true },
      events_migrated: { type: Sequelize.BOOLEAN, allowNull: true },
    },
    {
      tableName: 'EvmEventSources',
      timestamps: false,
    },
  );
