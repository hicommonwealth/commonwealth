import Sequelize from 'sequelize';
import { ChainNodeAttributes } from './chain_node';
import { ContractAttributes } from './contract';
import { ContractAbiAttributes } from './contract_abi';
import { ModelInstance } from './types';

export type EvmEventSourceAttributes = {
  id?: number;
  chain_node_id: number;
  contract_address: string;
  event_signature: string;
  kind: string;
  created_at_block?: number;
  events_migrated?: boolean;
  active?: boolean;
  abi_id: number;

  ContractAbi?: ContractAbiAttributes;
  Contract?: ContractAttributes;
  ChainNode?: ChainNodeAttributes;
};

export type EvmEventSourceInstance = ModelInstance<EvmEventSourceAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<EvmEventSourceInstance> =>
  sequelize.define(
    'EvmEventSource',
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      chain_node_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: 'unique_event_source',
      },
      contract_address: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'unique_event_source',
      },
      event_signature: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'unique_event_source',
      },
      kind: { type: Sequelize.STRING, allowNull: false },
      created_at_block: { type: Sequelize.INTEGER, allowNull: true },
      events_migrated: { type: Sequelize.BOOLEAN, allowNull: true },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      abi_id: { type: Sequelize.INTEGER, allowNull: false },
    },
    {
      tableName: 'EvmEventSources',
      timestamps: false,
    },
  );
