import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ModelStatic, ModelInstance } from './types';

export type ChainNodeAttributes = {
  id: number;
  url: string;
}

export type ChainNodeInstance = ModelInstance<ChainNodeAttributes> & {
  // TODO: add mixins as needed
}

export type ChainNodeModelStatic = ModelStatic<ChainNodeInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainNodeModelStatic => {
  const ChainNode = <ChainNodeModelStatic>sequelize.define(
    'ChainNode',
    {
      id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      url: { type: dataTypes.STRING, allowNull: false }
    },
    {
      tableName: 'ChainNodes',
      timestamps: false,
      underscored: true,
    },
  );

  ChainNode.associate = (models) => {
    models.ChainNode.hasMany(models.Chain, { foreignKey: 'chain_node_id' });
  };

  return ChainNode;
};
