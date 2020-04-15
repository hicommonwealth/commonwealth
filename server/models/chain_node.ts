import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { ChainInstance, ChainAttributes } from './chain';

export interface ChainNodeAttributes {
  id?: number;
  chain: string;
  url: string;
  address: string;

  // associations
  Chain: ChainAttributes;
}

export interface ChainNodeInstance extends Sequelize.Instance<ChainNodeAttributes>, ChainNodeAttributes {
  // TODO: add mixins as needed
  getChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
}

export type ChainNodeModel = Sequelize.Model<ChainNodeInstance, ChainNodeAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes
): ChainNodeModel => {
  const ChainNode = sequelize.define<ChainNodeInstance, ChainNodeAttributes>('ChainNode', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    url: { type: dataTypes.STRING, allowNull: false },
    address: { type: dataTypes.STRING, allowNull: true },
  }, {
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
