import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { DataTypes } from 'sequelize';
import { ChainInstance, ChainAttributes } from './chain';
import { ModelStatic, ModelInstance } from './types';

export type ChainNodeAttributes = {
  url: string;
  id?: number;
  eth_chain_id?: number;
  alt_wallet_url?: string;
  private_url?: string;

  // associations
  Chains?: ChainAttributes[];
}

export type ChainNodeInstance = ModelInstance<ChainNodeAttributes> & {
  // TODO: add mixins as needed
  getChains: Sequelize.HasManyGetAssociationsMixin<ChainInstance>;
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
      url: { type: dataTypes.STRING, allowNull: false },
      eth_chain_id: { type: dataTypes.INTEGER, allowNull: true },
      alt_wallet_url: { type: dataTypes.STRING, allowNull: true },
      private_url: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'ChainNodes',
      timestamps: false,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: [
            'private_url'
          ],
        }
      },
      scopes: {
        withPrivateData: {}
      }
    },
  );

  ChainNode.associate = (models) => {
    models.ChainNode.hasMany(models.Chain, { foreignKey: 'chain_node_id' });
  };

  return ChainNode;
};
