import { Community } from '@hicommonwealth/schemas';
import Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { z } from 'zod';
import type { AddressInstance } from './address';
import type { ChainNodeAttributes, ChainNodeInstance } from './chain_node';
import type { CommentAttributes } from './comment';
import type { CommunityAlertAttributes } from './community_alerts';
import type { CommunityTagsAttributes } from './community_tags';
import type { StarredCommunityAttributes } from './starred_community';
import type { ThreadAttributes } from './thread';
import type { TopicInstance } from './topic';
import type { ModelInstance } from './types';
import type { UserAttributes } from './user';

export type CommunityAttributes = z.infer<typeof Community> & {
  // associations
  ChainNode?: ChainNodeAttributes;
  CommunityTags?: CommunityTagsAttributes[];
  StarredCommunities?: StarredCommunityAttributes[];
  Threads?: ThreadAttributes[] | ThreadAttributes['id'][];
  Comments?: CommentAttributes[] | CommentAttributes['id'][];
  Users?: UserAttributes[] | UserAttributes['id'][];
  ChainObjectVersion?: any; // TODO
  lifetime_thread_count?: number;
  profile_count?: number;
  count_updated?: boolean;
  communityAlerts?: CommunityAlertAttributes[];
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
};

export default (
  sequelize: Sequelize.Sequelize,
): Sequelize.ModelStatic<CommunityInstance> =>
  sequelize.define<CommunityInstance>(
    // Leave this as is for now so that we don't need to alias and models can join
    // with this model using .Chain rather than .Community. Models should incrementally
    // be aliased via `as: 'Community'` until all models use Community at which point,
    // this can be updated to 'Community' and all aliases can be removed.
    'Community',
    {
      id: { type: Sequelize.STRING, primaryKey: true },
      chain_node_id: { type: Sequelize.INTEGER, allowNull: true }, // only null if starter community
      name: { type: Sequelize.STRING, allowNull: false },
      discord_config_id: { type: Sequelize.INTEGER, allowNull: true }, // null if no bot enabled
      description: { type: Sequelize.STRING, allowNull: true },
      token_name: { type: Sequelize.STRING, allowNull: true },
      social_links: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      default_symbol: { type: Sequelize.STRING, allowNull: true },
      network: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'edgeware',
      },
      base: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
      ss58_prefix: { type: Sequelize.INTEGER, allowNull: true },
      icon_url: { type: Sequelize.STRING },
      active: { type: Sequelize.BOOLEAN, defaultValue: false },
      stages_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      custom_stages: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      custom_domain: { type: Sequelize.STRING, allowNull: true },
      block_explorer_ids: { type: Sequelize.STRING, allowNull: true },
      collapsed_on_homepage: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      type: { type: Sequelize.STRING, allowNull: false, defaultValue: 'chain' },
      default_summary_view: { type: Sequelize.BOOLEAN, allowNull: true },
      default_page: { type: Sequelize.STRING, allowNull: true },
      has_homepage: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: false,
      },
      hide_projects: { type: Sequelize.BOOLEAN, allowNull: true },
      terms: { type: Sequelize.STRING, allowNull: true },
      bech32_prefix: { type: Sequelize.STRING, allowNull: true },
      admin_only_polling: { type: Sequelize.BOOLEAN, allowNull: true },
      discord_bot_webhooks_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      directory_page_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      directory_page_chain_node_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      lifetime_thread_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      profile_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      namespace: { type: Sequelize.STRING, allowNull: true },
      namespace_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: true },
      updated_at: { type: Sequelize.DATE, allowNull: true },
      redirect: { type: Sequelize.TEXT, allowNull: true },
      snapshot_spaces: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      include_in_digest_email: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      banner_text: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'Communities',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: false,
      indexes: [{ fields: ['include_in_digest_email'] }],
    },
  );
