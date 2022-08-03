import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type ChainAttributes = {
  id: string;
};

export type ChainInstance = ModelInstance<ChainAttributes> & {};

export type ChainModelStatic = ModelStatic<ChainInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainModelStatic => {
  const Chain = <ChainModelStatic>sequelize.define(
    'Chain',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
    },
    {
      tableName: 'Chains',
      timestamps: false,
      underscored: false,
    }
  );

  Chain.associate = (models) => {};

  return Chain;
};
