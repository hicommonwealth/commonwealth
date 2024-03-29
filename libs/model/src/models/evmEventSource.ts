import Sequelize, { DataTypes } from 'sequelize';
import { ChainNodeAttributes } from './chain_node';
import { ContractAttributes } from './contract';
import { ContractAbiAttributes } from './contract_abi';
import { ModelInstance, ModelStatic } from './types';

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

export type EvmEventSourceModelStatic = ModelStatic<EvmEventSourceInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): EvmEventSourceModelStatic => {
  const EvmEventSource: EvmEventSourceModelStatic = <EvmEventSourceModelStatic>(
    sequelize.define(
      'EvmEventSource',
      {
        id: {
          type: dataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        chain_node_id: {
          type: dataTypes.INTEGER,
          allowNull: false,
          unique: 'unique_event_source',
        },
        contract_address: {
          type: dataTypes.STRING,
          allowNull: false,
          unique: 'unique_event_source',
        },
        event_signature: {
          type: dataTypes.STRING,
          allowNull: false,
          unique: 'unique_event_source',
        },
        kind: { type: dataTypes.STRING, allowNull: false },
        created_at_block: { type: dataTypes.INTEGER, allowNull: true },
        events_migrated: { type: dataTypes.BOOLEAN, allowNull: true },
        active: {
          type: dataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        abi_id: { type: dataTypes.INTEGER, allowNull: false },
      },
      {
        tableName: 'EvmEventSources',
        timestamps: false,
      },
    )
  );

  EvmEventSource.associate = (models: any) => {
    models.EvmEventSource.belongsTo(models.ChainNode, {
      foreignKey: 'chain_node_id',
      targetKey: 'id',
    });
    models.EvmEventSource.belongsTo(models.ContractAbi, {
      foreignKey: 'abi_id',
      targetKey: 'id',
    });
  };

  return EvmEventSource;
};
