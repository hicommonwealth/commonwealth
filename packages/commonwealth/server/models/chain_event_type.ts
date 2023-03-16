import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';
import type { ModelInstance, ModelStatic } from './types';

export type ChainEventTypeAttributes = {
  id: string;
};

export type ChainEventTypeInstance = ModelInstance<ChainEventTypeAttributes>;

export type ChainEventTypeModelStatic = ModelStatic<ChainEventTypeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainEventTypeModelStatic => {
  const ChainEventType = <ChainEventTypeModelStatic>sequelize.define(
    'ChainEventType',
    {
      // id = chain-event_name (event_name is value of string enum)
      id: { type: dataTypes.STRING, primaryKey: true },
    },
    {
      tableName: 'ChainEventTypes',
      timestamps: false,
      underscored: true,
      indexes: [{ fields: ['id'] }],
    }
  );

  ChainEventType.associate = (models) => {
    models.ChainEventType.hasMany(models.Subscription, {
      foreignKey: 'chain_event_type_id',
    });
  };

  return ChainEventType;
};
