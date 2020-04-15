import * as Sequelize from 'sequelize';

import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { MembershipAttributes } from './membership';
import { OffchainTagAttributes } from './offchain_tag';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainCommunityAttributes {
  id: string;
  name: string;
  creator_id: number;
  default_chain: string;
  description?: string;
  featured_tags?: string[];
  privacyEnabled?: boolean;
  invitesEnabled?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Chain?: ChainAttributes;
  Address?: AddressAttributes;
  tags?: OffchainTagAttributes[] | OffchainTagAttributes['id'][];
  OffchainThreads?: OffchainThreadAttributes[] | OffchainThreadAttributes['id'][];
  Memberships?: MembershipAttributes[] | MembershipAttributes['id'][];
}

export interface OffchainComunityInstance
extends Sequelize.Instance<OffchainCommunityAttributes>, OffchainCommunityAttributes {

}

export type OffchainCommunityModel = Sequelize.Model<OffchainComunityInstance, OffchainCommunityAttributes>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: Sequelize.DataTypes,
): OffchainCommunityModel => {
  const OffchainCommunity = sequelize.define<OffchainComunityInstance, OffchainCommunityAttributes>(
    'OffchainCommunity', {
      id: { type: dataTypes.STRING, primaryKey: true },
      name: { type: dataTypes.STRING, allowNull: false },
      creator_id: { type: dataTypes.INTEGER, allowNull: false },
      default_chain: { type: dataTypes.STRING, allowNull: false },
      description: { type: dataTypes.TEXT, allowNull: true },
      featured_tags: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false, defaultValue: [] },
      // auth_forum: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // auth_condition: { type: DataTypes.STRING, allowNull: true, defaultValue: null }, // For Auth Forum Checking
      // ^^^ other names: community_config, OffchainCommunityConfiguration, CommunityConditions

      // XXX: mixing camelCase and underscore_case is bad practice
      privacyEnabled: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      invitesEnabled: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
      underscored: true,
      paranoid: true,
      indexes: [
        { fields: ['id'], unique: true },
        { fields: ['creator_id'] },
      ],
    }
  );

  OffchainCommunity.associate = (models) => {
    models.OffchainCommunity.belongsTo(models.Chain, { foreignKey: 'default_chain', targetKey: 'id', });
    models.OffchainCommunity.belongsTo(models.Address, { foreignKey: 'creator_id', targetKey: 'id', });
    models.OffchainCommunity.hasMany(models.OffchainTag, { as: 'tags', foreignKey: 'community_id' });
    models.OffchainCommunity.hasMany(models.OffchainThread, { foreignKey: 'community' });
    models.OffchainCommunity.hasMany(models.Membership, { foreignKey: 'chain' });
  };

  return OffchainCommunity;
};
