import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';

import type { ModelStatic, ModelInstance } from './types';
import type {
  ChainEntityAttributes,
  ChainEntityInstance,
} from './chain_entity';
import type { SupportedNetwork } from '../../../src';

export type ChainEventAttributes = {
  id: number;
  block_number: number;
  event_data: any;
  queued: number;
  entity_id?: number;
  network: SupportedNetwork;
  chain: string;
  created_at?: Date;
  updated_at?: Date;

  ChainEntity?: ChainEntityAttributes;
};

export type ChainEventInstance = ModelInstance<ChainEventAttributes> & {
  getChainEntity: Sequelize.HasOneGetAssociationMixin<ChainEntityInstance>;
};

export type ChainEventModelStatic = ModelStatic<ChainEventInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainEventModelStatic => {
  const ChainEvent = <ChainEventModelStatic>sequelize.define(
    'ChainEvent',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      block_number: { type: dataTypes.INTEGER, allowNull: false },
      entity_id: { type: dataTypes.INTEGER, allowNull: true },
      event_data: { type: dataTypes.JSONB, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      queued: { type: dataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
      chain: { type: dataTypes.STRING, allowNull: false },
      network: { type: dataTypes.STRING, allowNull: false },
    },
    {
      tableName: 'ChainEvents',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['id'] },
        { fields: ['block_number', 'chain_event_type_id'] },
      ],
    }
  );

  ChainEvent.associate = (models) => {
    models.ChainEvent.belongsTo(models.ChainEntity, {
      foreignKey: 'entity_id',
      targetKey: 'id',
    });
  };

  return ChainEvent;
};
