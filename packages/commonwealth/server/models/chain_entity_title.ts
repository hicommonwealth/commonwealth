import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type ChainEntityTitleAttributes = {
  id: number;
  title?: string;
}

export type ChainEntityTitleInstance = ModelInstance<ChainEntityTitleAttributes>;

export type ChainEntityTitleModelStatic = ModelStatic<ChainEntityTitleInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainEntityTitleModelStatic => {
  const ChainEntityTitle = <ChainEntityTitleModelStatic>sequelize.define<ChainEntityTitleInstance, ChainEntityTitleAttributes>('ChainEntity', {
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

  ChainEntityTitle.associate = (models) => {};

  return ChainEntityTitle;
};
