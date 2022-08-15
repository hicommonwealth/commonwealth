import * as Sequelize from 'sequelize';
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type ChainEventTypeAttributes = {
  id: string;
}

export type ChainEventTypeInstance = ModelInstance<ChainEventTypeAttributes>;

export type ChainEventTypeModelStatic = ModelStatic<ChainEventTypeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainEventTypeModelStatic => {
  const ChainEventType = <ChainEventTypeModelStatic>sequelize.define('ChainEventType', {
    // id = chain-event_name (event_name is value of string enum)
    id: { type: dataTypes.STRING, primaryKey: true }
  }, {
    tableName: 'ChainEventTypes',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['id'] },
    ],
  });

  ChainEventType.associate = (models) => {};

  return ChainEventType;
};
