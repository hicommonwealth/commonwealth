import type {
  ChainBase,
  ChainNetwork,
  ChainType,
  DefaultPage,
} from '@hicommonwealth/core';
import type { RegisteredTypes } from '@polkadot/types/types';
import type * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import type { DataTypes } from 'sequelize';
import type { AddressAttributes, AddressInstance } from './address';
import type { ChainNodeAttributes, ChainNodeInstance } from './chain_node';
import type { CommentAttributes } from './comment';
import type { ContractInstance } from './contract';
import type { StarredCommunityAttributes } from './starred_community';
import type { ThreadAttributes } from './thread';
import type { TopicAttributes, TopicInstance } from './topic';
import type { ModelInstance, ModelStatic } from './types';
import type { UserAttributes } from './user';

export type CommunityAttributes = {
  name: string;
  chain_node_id: number;
  default_symbol: string;
  network: ChainNetwork;
  base: ChainBase;
  icon_url: string;
  active: boolean;
  type: ChainType;
  id?: string;
  description?: string;
  social_links?: string[];
  ss58_prefix?: number;
  stages_enabled?: boolean;
  custom_stages?: string;
  custom_domain?: string;
  block_explorer_ids?: string;
  collapsed_on_homepage?: boolean;
  substrate_spec?: RegisteredTypes;
  has_chain_events_listener?: boolean;
  default_summary_view?: boolean;
  default_page?: DefaultPage;
  has_homepage?: boolean;
  terms?: string;
  admin_only_polling?: boolean;
  bech32_prefix?: string;
  hide_projects?: boolean;
  token_name?: string;
  ce_verbose?: boolean;
  discord_config_id?: number;
  category?: any;
  discord_bot_webhooks_enabled?: boolean;
  directory_page_enabled?: boolean;
  directory_page_chain_node_id?: number;
  namespace?: string;

  // associations
  ChainNode?: ChainNodeAttributes;
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  StarredCommunities?:
    | StarredCommunityAttributes[]
    | StarredCommunityAttributes['id'][];
  topics?: TopicAttributes[] | TopicAttributes['id'][];
  Threads?: ThreadAttributes[] | ThreadAttributes['id'][];
  Comments?: CommentAttributes[] | CommentAttributes['id'][];
  Users?: UserAttributes[] | UserAttributes['id'][];
  ChainObjectVersion?; // TODO
  Contract?: ContractInstance;

  created_at?: Date;
  updated_at?: Date;
};

export type CommunityInstance = ModelInstance<CommunityAttributes> & {
  // add mixins as needed
  getChainNode: Sequelize.BelongsToGetAssociationMixin<ChainNodeInstance>;
  hasAddresses: Sequelize.HasManyHasAssociationsMixin<
    AddressInstance,
    AddressInstance['id']
  >;
  getAddresses: Sequelize.HasManyGetAssociationsMixin<AddressInstance>;
  getTopics: Sequelize.HasManyGetAssociationsMixin<TopicInstance>;
  removeTopics: Sequelize.HasManyRemoveAssociationsMixin<
    TopicInstance,
    TopicInstance['id']
  >;
  getContracts: Sequelize.BelongsToManyGetAssociationsMixin<ContractInstance>;
};

export type CommunityModelStatic = ModelStatic<CommunityInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): CommunityModelStatic => {
  const Community = <CommunityModelStatic>sequelize.define(
    // Leave this as is for now so that we don't need to alias and models can join
    // with this model using .Chain rather than .Community. Models should incrementally
    // be aliased via `as: 'Community'` until all models use Community at which point,
    // this can be updated to 'Community' and all aliases can be removed.
    'Chain',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
      chain_node_id: { type: dataTypes.INTEGER, allowNull: true }, // only null if starter community
      name: { type: dataTypes.STRING, allowNull: false },
      discord_config_id: { type: dataTypes.INTEGER, allowNull: true }, // null if no bot enabled
      description: { type: dataTypes.STRING, allowNull: true },
      token_name: { type: dataTypes.STRING, allowNull: true },
      social_links: {
        type: dataTypes.ARRAY(dataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      default_symbol: { type: dataTypes.STRING, allowNull: false },
      network: { type: dataTypes.STRING, allowNull: false },
      base: { type: dataTypes.STRING, allowNull: false, defaultValue: '' },
      ss58_prefix: { type: dataTypes.INTEGER, allowNull: true },
      icon_url: { type: dataTypes.STRING },
      active: { type: dataTypes.BOOLEAN },
      stages_enabled: {
        type: dataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      custom_stages: { type: dataTypes.STRING, allowNull: true },
      custom_domain: { type: dataTypes.STRING, allowNull: true },
      block_explorer_ids: { type: dataTypes.STRING, allowNull: true },
      collapsed_on_homepage: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      type: { type: dataTypes.STRING, allowNull: false },
      substrate_spec: { type: dataTypes.JSONB, allowNull: true },
      has_chain_events_listener: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      default_summary_view: { type: dataTypes.BOOLEAN, allowNull: true },
      default_page: { type: dataTypes.STRING, allowNull: true },
      has_homepage: { type: dataTypes.BOOLEAN, allowNull: true },
      hide_projects: { type: dataTypes.BOOLEAN, allowNull: true },
      terms: { type: dataTypes.STRING, allowNull: true },
      bech32_prefix: { type: dataTypes.STRING, allowNull: true },
      admin_only_polling: { type: dataTypes.BOOLEAN, allowNull: true },
      category: { type: dataTypes.JSONB, allowNull: true },
      discord_bot_webhooks_enabled: {
        type: dataTypes.BOOLEAN,
        defaultValue: false,
      },
      directory_page_enabled: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      directory_page_chain_node_id: {
        type: dataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      created_at: { type: dataTypes.DATE, allowNull: true },
      updated_at: { type: dataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'Communities',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
    },
  );

  Community.associate = (models) => {
    models.Community.belongsTo(models.ChainNode, {
      foreignKey: 'chain_node_id',
    });
    models.Community.hasMany(models.Address, { foreignKey: 'community_id' });
    models.Community.hasMany(models.Notification, { foreignKey: 'chain_id' });
    models.Community.hasMany(models.Topic, {
      as: 'topics',
      foreignKey: 'community_id',
    });
    models.Community.hasMany(models.Thread, { foreignKey: 'community_id' });
    models.Community.hasMany(models.Comment, { foreignKey: 'community_id' });
    models.Community.hasMany(models.StarredCommunity, { foreignKey: 'chain' });
    models.Community.belongsToMany(models.Contract, {
      through: models.CommunityContract,
    });
    models.Community.hasMany(models.Group, { foreignKey: 'community_id' });
  };

  return Community;
};
