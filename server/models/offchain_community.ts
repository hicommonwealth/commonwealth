import * as Sequelize from 'sequelize';

import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { StarredCommunityAttributes } from './starred_community';
import { OffchainTagAttributes } from './offchain_tag';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainCommunityAttributes {
  id: string;
  name: string;
  creator_id: number;
  default_chain: string;
  description?: string;
  website?: string;
  chat?: string;
  telegram?: string;
  github?: string;
  featured_tags?: string[];
  visible: boolean;
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
  StarredCommunities?: StarredCommunityAttributes[] | StarredCommunityAttributes['id'][];
}

export interface OffchainComunityInstance
extends Sequelize.Instance<OffchainCommunityAttributes>, OffchainCommunityAttributes {

}

export interface OffchainCommunityModel extends Sequelize.Model<OffchainComunityInstance, OffchainCommunityAttributes> {

}

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
      visible: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      description: { type: dataTypes.TEXT, allowNull: true },
      website: { type: dataTypes.STRING, allowNull: true },
      chat: { type: dataTypes.STRING, allowNull: true },
      telegram: { type: dataTypes.STRING, allowNull: true },
      github: { type: dataTypes.STRING, allowNull: true },
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
    models.OffchainCommunity.belongsTo(models.Chain, { foreignKey: 'default_chain', targetKey: 'id' });
    models.OffchainCommunity.belongsTo(models.Address, { foreignKey: 'creator_id', targetKey: 'id' });
    models.OffchainCommunity.hasMany(models.OffchainTag, { as: 'tags', foreignKey: 'community_id' });
    models.OffchainCommunity.hasMany(models.OffchainThread, { foreignKey: 'community' });
    models.OffchainCommunity.hasMany(models.StarredCommunity, { foreignKey: 'community' });
  };

  return OffchainCommunity;
};
