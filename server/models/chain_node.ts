type ChainAttributes = {};
type ChainInstance = {};

import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors

export interface ChainNodeAttributes {
  id: number;
  chain: string;
  url: string;
  address: string;
}

export interface ChainNodeInstance extends Sequelize.Instance<ChainNodeAttributes>, ChainNodeAttributes {
  getChain: Sequelize.BelongsToGetAssociationMixin<ChainInstance>;
  setChain: Sequelize.BelongsToSetAssociationMixin<ChainInstance, string>;
  createChain: Sequelize.BelongsToCreateAssociationMixin<ChainAttributes, ChainInstance>;
}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes
): Sequelize.Model<ChainNodeInstance, ChainNodeAttributes> => {
  const ChainNode = sequelize.define<ChainNodeInstance, ChainNodeAttributes>('ChainNode', {
    id: { type: dataTypes.INTEGER, primaryKey: true },
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
