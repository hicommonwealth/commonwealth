import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type ChainEntityAttributes = {
  id: number;
  title?: string;
}

export type ChainEntityInstance = ModelInstance<ChainEntityAttributes>;

export type ChainEntityModelStatic = ModelStatic<ChainEntityInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainEntityModelStatic => {
  const ChainEntity = <ChainEntityModelStatic>sequelize.define<ChainEntityInstance, ChainEntityAttributes>('ChainEntity', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: dataTypes.STRING, allowNull: true },
  }, {
    tableName: 'ChainEntitiesTitles',
    timestamps: false,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['id'] },
    ],
  });

  ChainEntity.associate = (models) => {
    models.ChainEntity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ChainEntity.hasMany(models.ChainEvent, { foreignKey: 'entity_id' });
  };

  return ChainEntity;
};
