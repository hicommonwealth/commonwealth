import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { BuildOptions, Model, DataTypes } from 'sequelize';
import { ChainInstance, ChainAttributes } from './chain';

export interface ChainNodeAttributes {
  id?: number;
  chain: string;
  url: string;
  address?: string;

  // associations
  Chain?: ChainAttributes;
}

export interface ChainNodeInstance extends Model<ChainNodeAttributes>, ChainNodeAttributes {
  // TODO: add mixins as needed
  getChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
}

type ChainNodeModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): ChainNodeInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainNodeModelStatic => {
  const ChainNode = <ChainNodeModelStatic>sequelize.define('ChainNode', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    url: { type: dataTypes.STRING, allowNull: false },
    address: { type: dataTypes.STRING, allowNull: true },
  }, {
    tableName: 'ChainNodes',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['chain'] },
    ],
  });

  ChainNode.associate = (models) => {
    models.ChainNode.belongsTo(models.Chain, { foreignKey: 'chain' });
  };

  return ChainNode;
};
