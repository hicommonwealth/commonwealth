import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ModelStatic } from './types';
import { AddressAttributes } from './address';
import { ChainAttributes } from './chain';
import { StarredCommunityAttributes } from './starred_community';
import { OffchainTopicAttributes } from './offchain_topic';
import { OffchainThreadAttributes } from './offchain_thread';

export interface OffchainCommunityAttributes {
  id: string;
  name: string;
  creator_id: number;
  default_chain: string;
  featured_topics?: string[];
  privacy_enabled?: boolean;
  invites_enabled?: boolean;
  description?: string;
  website?: string;
  discord?: string;
  element?: string;
  telegram?: string;
  github?: string;
  terms?: string;
  custom_domain?: string;
  icon_url?: string;
  stages_enabled?: boolean;
  custom_stages?: string;
  collapsed_on_homepage?: boolean;
  default_summary_view?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;

  // associations
  Chain?: ChainAttributes;
  Address?: AddressAttributes;
  topics?: OffchainTopicAttributes[] | OffchainTopicAttributes['id'][];
  OffchainThreads?:
    | OffchainThreadAttributes[]
    | OffchainThreadAttributes['id'][];
  StarredCommunities?:
    | StarredCommunityAttributes[]
    | StarredCommunityAttributes['id'][];
}

export interface OffchainCommunityInstance
  extends Model<OffchainCommunityAttributes>,
    OffchainCommunityAttributes {}

export type OffchainCommunityModelStatic =
  ModelStatic<OffchainCommunityInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): OffchainCommunityModelStatic => {
  const OffchainCommunity = <OffchainCommunityModelStatic>sequelize.define(
    'OffchainCommunity',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
      name: { type: dataTypes.STRING, allowNull: false },
      creator_id: { type: dataTypes.INTEGER, allowNull: false },
      default_chain: { type: dataTypes.STRING, allowNull: false },
      icon_url: { type: dataTypes.STRING, allowNull: true },
      description: { type: dataTypes.TEXT, allowNull: true },
      website: { type: dataTypes.STRING, allowNull: true },
      discord: { type: dataTypes.STRING, allowNull: true },
      element: { type: dataTypes.STRING, allowNull: true },
      telegram: { type: dataTypes.STRING, allowNull: true },
      github: { type: dataTypes.STRING, allowNull: true },
      featured_topics: {
        type: dataTypes.ARRAY(dataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      terms: { type: dataTypes.STRING, allowNull: true },
      // auth_forum: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      // auth_condition: { type: DataTypes.STRING, allowNull: true, defaultValue: null }, // For Auth Forum Checking
      // ^^^ other names: community_config, OffchainCommunityConfiguration, CommunityConditions

      // XXX: mixing camelCase and underscore_case is bad practice
      privacy_enabled: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      invites_enabled: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      stages_enabled: {
        type: dataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      custom_stages: { type: dataTypes.STRING, allowNull: true },
      custom_domain: { type: dataTypes.STRING, allowNull: true },
      collapsed_on_homepage: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      default_summary_view: { type: dataTypes.BOOLEAN, allowNull: true },
    },
    {
      tableName: 'OffchainCommunities',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      underscored: false,
      paranoid: true,
      indexes: [{ fields: ['id'], unique: true }, { fields: ['creator_id'] }],
    }
  );

  OffchainCommunity.associate = (models) => {
    models.OffchainCommunity.belongsTo(models.Chain, {
      foreignKey: 'default_chain',
      targetKey: 'id',
    });
    models.OffchainCommunity.belongsTo(models.Address, {
      foreignKey: 'creator_id',
      targetKey: 'id',
    });
    models.OffchainCommunity.hasMany(models.OffchainTopic, {
      as: 'topics',
      foreignKey: 'community_id',
    });
    models.OffchainCommunity.hasMany(models.OffchainThread, {
      foreignKey: 'community',
    });
    models.OffchainCommunity.hasMany(models.StarredCommunity, {
      foreignKey: 'community',
    });
  };

  return OffchainCommunity;
};
