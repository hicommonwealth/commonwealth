import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { ChainNodeInstance } from './chain_node';

export interface ChainAttributes {
  id: string;
  name: string;
  description?: string;
  featured_tags: string[];
  symbol: string;
  network: string;
  icon_url: string;
  active: boolean;
  type: string;
}

export interface ChainInstance extends Sequelize.Instance<ChainAttributes>, ChainAttributes {
  // TODO: add mixins as needed
  getChainNodes: Sequelize.HasManyGetAssociationsMixin<ChainNodeInstance>;
}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): Sequelize.Model<ChainInstance, ChainAttributes> => {
  const Chain = sequelize.define<ChainInstance, ChainAttributes>('Chain', {
    id: { type: dataTypes.STRING, primaryKey: true },
    name: { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.STRING, allowNull: true },
    featured_tags: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false, defaultValue: [] },
    symbol: { type: dataTypes.STRING, allowNull: false },
    network: { type: dataTypes.STRING, allowNull: false },
    icon_url: { type: dataTypes.STRING },
    active: { type: dataTypes.BOOLEAN },
    type: { type: dataTypes.STRING, allowNull: false },
  }, {
    timestamps: false,
    underscored: true,
  });

  Chain.associate = (models) => {
    models.Chain.hasMany(models.ChainNode, { foreignKey: 'chain' });
    models.Chain.hasMany(models.Address, { foreignKey: 'chain' });
    models.Chain.hasMany(models.Membership, { foreignKey: 'chain' });
    models.Chain.hasMany(models.OffchainTag, { as: 'tags', foreignKey: 'chain_id' });
    models.Chain.hasMany(models.OffchainThread, { foreignKey: 'chain' });
    models.Chain.hasMany(models.OffchainComment, { foreignKey: 'chain' });
    models.Chain.belongsToMany(models.User, { through: models.WaitlistRegistration });

    // currently we have a 1-to-1 mapping from chain <--> chain_object_version
    // in the future, we may want this to be a many-to-1, in case a chain has
    // many versions of chain objects. however, for now, the client only supports 1.
    models.Chain.hasOne(models.ChainObjectVersion, {
      foreignKey: 'chain',
    });
  };

  return Chain;
};
