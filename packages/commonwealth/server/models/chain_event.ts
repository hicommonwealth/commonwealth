import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

import {
  ChainEventTypeAttributes,
  ChainEventTypeInstance,
} from './chain_event_type';
import { ChainEntityAttributes } from './chain_entity';

export type ChainEventAttributes = {
  chain_event_type_id: string;
  block_number: number;
  id?: number;
  entity_id?: number;
  event_data: any;
  created_at?: Date;
  updated_at?: Date;

  ChainEventType?: ChainEventTypeAttributes;
  ChainEntity?: ChainEntityAttributes;
}

export type ChainEventInstance = ModelInstance<ChainEventAttributes> & {
  getChainEventType: Sequelize.HasOneGetAssociationMixin<ChainEventTypeInstance>;
}

export type ChainEventModelStatic = ModelStatic<ChainEventInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainEventModelStatic => {
  const ChainEvent = <ChainEventModelStatic>sequelize.define(
    'ChainEvent',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chain_event_type_id: { type: dataTypes.STRING, allowNull: false },
      block_number: { type: dataTypes.INTEGER, allowNull: false },
      entity_id: { type: dataTypes.INTEGER, allowNull: true },
      event_data: { type: dataTypes.JSONB, allowNull: false },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
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
    // master event type
    models.ChainEvent.belongsTo(models.ChainEventType, {
      foreignKey: 'chain_event_type_id',
      targetKey: 'id',
    });
    models.ChainEvent.belongsTo(models.ChainEntity, {
      foreignKey: 'entity_id',
      targetKey: 'id',
    });
  };

  return ChainEvent;
};
