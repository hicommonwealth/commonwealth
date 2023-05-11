import type * as Sequelize from 'sequelize';
import type { DataTypes } from 'sequelize';

import type { ChainEventAttributes, ChainEventInstance } from './chain_event';
import type { ModelStatic, ModelInstance } from './types';

export type ChainEntityAttributes = {
  id: number;
  chain: string;
  type: string;
  type_id: string;
  queued: number;
  author?: string;
  completed?: boolean;
  created_at?: Date;
  updated_at?: Date;

  ChainEvents?: ChainEventAttributes[];
};

export type ChainEntityInstance = ModelInstance<ChainEntityAttributes> & {
  getChainEvents: Sequelize.HasManyGetAssociationsMixin<ChainEventInstance>;
};

export type ChainEntityModelStatic = ModelStatic<ChainEntityInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainEntityModelStatic => {
  const ChainEntity = <ChainEntityModelStatic>sequelize.define<
    ChainEntityInstance,
    ChainEntityAttributes
  >(
    'ChainEntity',
    {
      id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chain: { type: dataTypes.STRING, allowNull: false },
      type: { type: dataTypes.STRING, allowNull: false },
      type_id: { type: dataTypes.STRING, allowNull: false },
      completed: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      author: { type: dataTypes.STRING, allowNull: true },
      created_at: { type: dataTypes.DATE, allowNull: false },
      updated_at: { type: dataTypes.DATE, allowNull: false },
      queued: { type: dataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'ChainEntities',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
      paranoid: false,
      indexes: [
        { fields: ['id'] },
        { fields: ['chain', 'type', 'id'], unique: true },
      ],
    }
  );

  ChainEntity.associate = (models) => {
    models.ChainEntity.hasMany(models.ChainEvent, { foreignKey: 'entity_id' });
  };

  return ChainEntity;
};
