import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { RegisteredTypes } from '@polkadot/types/types';
import { Model, DataTypes } from 'sequelize';
import { AddressAttributes, AddressInstance } from './address';
import { ChainNodeInstance, ChainNodeAttributes } from './chain_node';
import { StarredCommunityAttributes } from './starred_community';
import {
  OffchainTopicAttributes,
  OffchainTopicInstance,
} from './offchain_topic';
import { OffchainThreadAttributes } from './offchain_thread';
import { OffchainCommentAttributes } from './offchain_comment';
import { UserAttributes } from './user';
import { ModelStatic } from './types';
import { ChainBase, ChainNetwork, ChainType } from '../../shared/types';

export interface ChainAttributes {
  name: string;
  symbol: string;
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
  decimals?: number;
  stages_enabled?: boolean;
  custom_stages?: string;
  custom_domain?: string;
  block_explorer_ids?: string;
  collapsed_on_homepage?: boolean;
  featured_topics?: string[];
  substrate_spec?: RegisteredTypes;
  has_chain_events_listener?: boolean;
  default_summary_view?: boolean;
  terms?: string;
  snapshot?: string[];
  bech32_prefix?: string;

  // associations
  ChainNodes?: ChainNodeAttributes[] | ChainNodeAttributes['id'][];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  StarredCommunities?:
    | StarredCommunityAttributes[]
    | StarredCommunityAttributes['id'][];
  topics?: OffchainTopicAttributes[] | OffchainTopicAttributes['id'][];
  OffchainThreads?:
    | OffchainThreadAttributes[]
    | OffchainThreadAttributes['id'][];
  OffchainComments?:
    | OffchainCommentAttributes[]
    | OffchainCommentAttributes['id'][];
  Users?: UserAttributes[] | UserAttributes['id'][];
  ChainObjectVersion?; // TODO
}

export interface ChainInstance extends Model<ChainAttributes>, ChainAttributes {
  // add mixins as needed
  getChainNodes: Sequelize.HasManyGetAssociationsMixin<ChainNodeInstance>;
  hasAddresses: Sequelize.HasManyHasAssociationsMixin<
    AddressInstance,
    AddressInstance['id']
  >;
  getAddresses: Sequelize.HasManyGetAssociationsMixin<AddressInstance>;
  getTopics: Sequelize.HasManyGetAssociationsMixin<OffchainTopicInstance>;
  removeTopics: Sequelize.HasManyRemoveAssociationsMixin<
    OffchainTopicInstance,
    OffchainTopicInstance['id']
  >;
}

export type ChainModelStatic = ModelStatic<ChainInstance>;

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes
): ChainModelStatic => {
  const Chain = <ChainModelStatic>sequelize.define(
    'Chain',
    {
      id: { type: dataTypes.STRING, primaryKey: true },
      name: { type: dataTypes.STRING, allowNull: false },
      description: { type: dataTypes.STRING, allowNull: true },
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
      symbol: { type: dataTypes.STRING, allowNull: false },
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
      decimals: { type: dataTypes.INTEGER, allowNull: true },
      substrate_spec: { type: dataTypes.JSONB, allowNull: true },
      has_chain_events_listener: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      default_summary_view: { type: dataTypes.BOOLEAN, allowNull: true },
      snapshot: {
        type: dataTypes.ARRAY(dataTypes.STRING),
        allowNull: true,
      },
      terms: { type: dataTypes.STRING, allowNull: true },
      bech32_prefix: { type: dataTypes.STRING, allowNull: true },
    },
    {
      tableName: 'Chains',
      timestamps: false,
      underscored: false,
    }
  );

  Chain.associate = (models) => {
    models.Chain.hasMany(models.ChainNode, { foreignKey: 'chain' });
    models.Chain.hasMany(models.Address, { foreignKey: 'chain' });
    models.Chain.hasMany(models.Notification, { foreignKey: 'chain_id' })
    models.Chain.hasMany(models.OffchainTopic, {
      as: 'topics',
      foreignKey: 'chain_id',
    });
    models.Chain.hasMany(models.OffchainThread, { foreignKey: 'chain' });
    models.Chain.hasMany(models.OffchainComment, { foreignKey: 'chain' });
    models.Chain.hasMany(models.StarredCommunity, { foreignKey: 'chain' });
    models.Chain.belongsToMany(models.User, {
      through: models.WaitlistRegistration,
    });
  };

  return Chain;
};
