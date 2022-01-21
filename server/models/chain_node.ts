import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { Model, DataTypes } from 'sequelize';
import { ChainInstance, ChainAttributes } from './chain';
import { ModelStatic } from './types';

export interface ChainNodeAttributes {
  chain: string;
  url: string;
  id?: number;
  address?: string;
  token_name?: string;
  ce_verbose?: boolean;
  eth_chain_id?: number;
  alt_wallet_url?: string;

  // associations
  Chain?: ChainAttributes;
}

export interface ChainNodeInstance
  extends Model<ChainNodeAttributes>,
    ChainNodeAttributes {
  // TODO: add mixins as needed
  getChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
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
      chain: { type: dataTypes.STRING, allowNull: false },
      url: { type: dataTypes.STRING, allowNull: false },
      address: { type: dataTypes.STRING, allowNull: true },
      token_name: { type: dataTypes.STRING, allowNull: true },
      ce_verbose: { type: dataTypes.BOOLEAN, allowNull: true },
      eth_chain_id: { type: dataTypes.INTEGER, allowNull: true },
      alt_wallet_url: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'ChainNodes',
      timestamps: false,
      underscored: true,
      indexes: [{ fields: ['chain'] }],
    }
  );

  ChainNode.associate = (models) => {
    models.ChainNode.belongsTo(models.Chain, { foreignKey: 'chain' });
  };

  return ChainNode;
};
