import * as Sequelize from 'sequelize';

import { ChainEventTypeAttributes } from './chain_event_type';
import { ChainEntityAttributes } from './chain_entity';

export interface ChainEventAttributes {
  id?: number;
  chain_event_type_id: string;
  block_number: number;
  entity_id?: number;
  event_data: object;
  created_at?: Date;
  updated_at?: Date;

  ChainEventType?: ChainEventTypeAttributes;
  ChainEntity?: ChainEntityAttributes;
}

export interface ChainEventInstance
extends Sequelize.Instance<ChainEventAttributes>, ChainEventAttributes {

}

export interface ChainEventModel extends Sequelize.Model<ChainEventInstance, ChainEventAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ChainEventModel => {
  const ChainEvent = sequelize.define<ChainEventInstance, ChainEventAttributes>('ChainEvent', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain_event_type_id: { type: dataTypes.STRING, allowNull: false },
    block_number: { type: dataTypes.INTEGER, allowNull: false },
    entity_id: { type: dataTypes.INTEGER, allowNull: true },
    event_data: { type: dataTypes.JSONB, allowNull: false },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['block_number', 'chain_event_type_id'] },
    ]
  });

  ChainEvent.associate = (models) => {
    // master event type
    models.ChainEvent.belongsTo(models.ChainEventType, { foreignKey: 'chain_event_type_id', targetKey: 'id' });
    models.ChainEvent.belongsTo(models.ChainEntity, { foreignKey: 'entity_id', targetKey: 'id' });
  };

  return ChainEvent;
};
