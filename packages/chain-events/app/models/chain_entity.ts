import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ChainAttributes } from './chain';
import { ChainEventAttributes } from './chain_event';
import { ModelStatic, ModelInstance } from './types';

export type ChainEntityAttributes = {
  id: number;
  chain: string;
  type: string;
  type_id: string;
  title?: string;
  author?: string;
  completed?: boolean;
  created_at?: Date;
  updated_at?: Date;

  Chain?: ChainAttributes;
  ChainEvents?: ChainEventAttributes[];
}

export type ChainEntityInstance = ModelInstance<ChainEntityAttributes>;

export type ChainEntityModelStatic = ModelStatic<ChainEntityInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainEntityModelStatic => {
  const ChainEntity = <ChainEntityModelStatic>sequelize.define<ChainEntityInstance, ChainEntityAttributes>('ChainEntity', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    type: { type: dataTypes.STRING, allowNull: false },
    type_id: { type: dataTypes.STRING, allowNull: false },
    completed: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    title: { type: dataTypes.STRING, allowNull: true },
    author: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    tableName: 'ChainEntities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['thread_id'] },
      { fields: ['chain', 'type', 'id' ] },
    ],
  });

  ChainEntity.associate = (models) => {
    models.ChainEntity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ChainEntity.hasMany(models.ChainEvent, { foreignKey: 'entity_id' });
  };

  return ChainEntity;
};
