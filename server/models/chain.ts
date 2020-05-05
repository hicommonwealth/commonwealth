import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors

import { AddressAttributes } from './address';
import { ChainNodeInstance, ChainNodeAttributes } from './chain_node';
import { MembershipAttributes } from './membership';
import { OffchainTagAttributes } from './offchain_tag';
import { OffchainThreadAttributes } from './offchain_thread';
import { OffchainCommentAttributes } from './offchain_comment';
import { UserAttributes } from './user';

export interface ChainAttributes {
  id?: string;
  name: string;
  description?: string;
  featured_tags: string[];
  symbol: string;
  network: string;
  icon_url: string;
  active: boolean;
  type: string;

  // associations
  ChainNodes?: ChainNodeAttributes[] | ChainNodeAttributes['id'][];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  Memberships?: MembershipAttributes[] | MembershipAttributes['id'][];
  tags?: OffchainTagAttributes[] | OffchainTagAttributes['id'][];
  OffchainThreads?: OffchainThreadAttributes[] | OffchainThreadAttributes['id'][];
  OffchainComments?: OffchainCommentAttributes[] | OffchainCommentAttributes['id'][];
  Users?: UserAttributes[] | UserAttributes['id'][];
  ChainObjectVersion?; // TODO
}

export interface ChainInstance extends Sequelize.Instance<ChainAttributes>, ChainAttributes {
  // add mixins as needed
  getChainNodes: Sequelize.HasManyGetAssociationsMixin<ChainNodeInstance>;
}

export interface ChainModel extends Sequelize.Model<ChainInstance, ChainAttributes> {

}

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): ChainModel => {
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
