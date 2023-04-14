import type { RegisteredTypes } from '@polkadot/types/types';
import type { ChainBase, ChainNetwork, ChainType, DefaultPage, } from 'common-common/src/types';
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

export type ChainAttributes = {
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
  discord?: string;
  element?: string;
  website?: string;
  telegram?: string;
  github?: string;
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
  default_allow_permissions: bigint;
  default_deny_permissions: bigint;

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
};

export type ChainInstance = ModelInstance<ChainAttributes> & {
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

export type ChainModelStatic = ModelStatic<ChainInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainModelStatic => {
  const Chain = <ChainModelStatic>sequelize.define(
    'Chain',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
      chain_node_id: { type: dataTypes.INTEGER, allowNull: true }, // only null if starter community
      name: { type: dataTypes.STRING, allowNull: false },
      discord_config_id: { type: dataTypes.INTEGER, allowNull: true }, // null if no bot enabled
      description: { type: dataTypes.STRING, allowNull: true },
      token_name: { type: dataTypes.STRING, allowNull: true },
      website: { type: dataTypes.STRING, allowNull: true },
      discord: { type: dataTypes.STRING, allowNull: true },
      element: { type: dataTypes.STRING, allowNull: true },
      telegram: { type: dataTypes.STRING, allowNull: true },
      github: { type: dataTypes.STRING, allowNull: true },
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
      default_allow_permissions: {
        type: dataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      default_deny_permissions: {
        type: dataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'Chains',
      timestamps: false,
      underscored: false,
    }
  );

  Chain.associate = (models) => {
    models.Chain.belongsTo(models.ChainNode, { foreignKey: 'chain_node_id' });
    models.Chain.hasMany(models.Address, { foreignKey: 'chain' });
    models.Chain.hasMany(models.Notification, { foreignKey: 'chain_id' });
    models.Chain.hasMany(models.Topic, {
      as: 'topics',
      foreignKey: 'chain_id',
    });
    models.Chain.hasMany(models.Thread, { foreignKey: 'chain' });
    models.Chain.hasMany(models.Comment, { foreignKey: 'chain' });
    models.Chain.hasMany(models.StarredCommunity, { foreignKey: 'chain' });
    models.Chain.hasMany(models.ChatChannel);
    models.Chain.belongsToMany(models.Contract, {
      through: models.CommunityContract,
    });
    models.Chain.hasMany(models.ChainEntityMeta, { foreignKey: 'chain' });
  };

  return Chain;
};
