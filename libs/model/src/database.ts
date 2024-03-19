import { logger } from '@hicommonwealth/core';
import { DataTypes, Sequelize } from 'sequelize';
import type { DB, Models } from './models';
import AddressFactory from './models/address';
import BanFactory from './models/ban';
import ChainNodeFactory from './models/chain_node';
import CollaborationFactory from './models/collaboration';
import CommentFactory from './models/comment';
import ChainFactory from './models/community';
import CommunityBannerFactory from './models/community_banner';
import CommunityContractFactory from './models/community_contract';
import CommunityContractTemplateMetadataFactory from './models/community_contract_metadata';
import CommunityContractTemplateFactory from './models/community_contract_template';
import CommunitySnapshotSpaceFactory from './models/community_snapshot_spaces';
import CommunityStakeFactory from './models/community_stake';
import ContractFactory from './models/contract';
import ContractAbiFactory from './models/contract_abi';
import DiscordBotConfigFactory from './models/discord_bot_config';
import EvmEventSourceFactory from './models/evmEventSource';
import GroupFactory from './models/group';
import LastProcessedEvmBlockFactory from './models/lastProcessedEvmBlock';
import LoginTokenFactory from './models/login_token';
import MembershipFactory from './models/membership';
import NotificationFactory from './models/notification';
import NotificationCategoryFactory from './models/notification_category';
import NotificationsReadFactory from './models/notifications_read';
import OutboxFactory from './models/outbox';
import PollFactory from './models/poll';
import ProfileFactory from './models/profile';
import ReactionFactory from './models/reaction';
import SnapshotProposalFactory from './models/snapshot_proposal';
import SnapshotSpaceFactory from './models/snapshot_spaces';
import SsoTokenFactory from './models/sso_token';
import StarredCommunityFactory from './models/starred_community';
import SubscriptionFactory from './models/subscription';
import TaggedThreadFactory from './models/tagged_threads';
import TemplateFactory from './models/template';
import ThreadFactory from './models/thread';
import TopicFactory from './models/topic';
import UserModelFactory from './models/user';
import VoteFactory from './models/vote';
import WebhookFactory from './models/webhook';

const log = logger().getLogger(__filename);

export const TEST_DB_NAME = 'common_test';
export const DATABASE_URI =
  process.env.NODE_ENV === 'test'
    ? `postgresql://commonwealth:edgeware@localhost/${TEST_DB_NAME}`
    : process.env.USES_DOCKER_DB
    ? 'postgresql://commonwealth:edgeware@postgres/commonwealth' // this is because url will be hidden in CI.yaml
    : !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

!process.env.DATABASE_URL &&
  process.env.NODE_ENV !== 'production' &&
  log.warn(`NODE_ENV=${process.env.NODE_ENV} DB_URI=${DATABASE_URI}`);

export const sequelize = new Sequelize(DATABASE_URI, {
  // disable string operators (https://github.com/sequelize/sequelize/issues/8417)
  // operatorsAliases: false,
  logging:
    process.env.NODE_ENV === 'test'
      ? false
      : (msg) => {
          log.trace(msg);
        },
  dialectOptions:
    process.env.NODE_ENV !== 'production' || process.env.NO_SSL
      ? { requestTimeout: 40000 }
      : DATABASE_URI ===
        'postgresql://commonwealth:edgeware@localhost/commonwealth'
      ? { requestTimeout: 40000, ssl: false }
      : { requestTimeout: 40000, ssl: { rejectUnauthorized: false } },
  pool: {
    max: 10,
    min: 0,
    acquire: 40000,
    idle: 40000,
  },
});

const _models: Models = {
  Address: AddressFactory(sequelize, DataTypes),
  Ban: BanFactory(sequelize, DataTypes),
  Community: ChainFactory(sequelize, DataTypes),
  ChainNode: ChainNodeFactory(sequelize, DataTypes),
  Collaboration: CollaborationFactory(sequelize, DataTypes),
  Contract: ContractFactory(sequelize, DataTypes),
  ContractAbi: ContractAbiFactory(sequelize, DataTypes),
  CommunityContract: CommunityContractFactory(sequelize, DataTypes),
  CommunityContractTemplate: CommunityContractTemplateFactory(
    sequelize,
    DataTypes,
  ),
  CommunityContractTemplateMetadata: CommunityContractTemplateMetadataFactory(
    sequelize,
    DataTypes,
  ),
  Template: TemplateFactory(sequelize, DataTypes),
  CommunityBanner: CommunityBannerFactory(sequelize, DataTypes),
  CommunitySnapshotSpaces: CommunitySnapshotSpaceFactory(sequelize, DataTypes),
  DiscordBotConfig: DiscordBotConfigFactory(sequelize, DataTypes),
  EvmEventSource: EvmEventSourceFactory(sequelize, DataTypes),
  LastProcessedEvmBlock: LastProcessedEvmBlockFactory(sequelize, DataTypes),
  LoginToken: LoginTokenFactory(sequelize, DataTypes),
  Notification: NotificationFactory(sequelize, DataTypes),
  NotificationCategory: NotificationCategoryFactory(sequelize, DataTypes),
  NotificationsRead: NotificationsReadFactory(sequelize, DataTypes),
  Comment: CommentFactory(sequelize, DataTypes),
  Poll: PollFactory(sequelize, DataTypes),
  Group: GroupFactory(sequelize, DataTypes),
  Membership: MembershipFactory(sequelize, DataTypes),
  Reaction: ReactionFactory(sequelize, DataTypes),
  Thread: ThreadFactory(sequelize, DataTypes),
  Topic: TopicFactory(sequelize, DataTypes),
  Vote: VoteFactory(sequelize, DataTypes),
  Profile: ProfileFactory(sequelize, DataTypes),
  SsoToken: SsoTokenFactory(sequelize, DataTypes),
  StarredCommunity: StarredCommunityFactory(sequelize, DataTypes),
  SnapshotProposal: SnapshotProposalFactory(sequelize, DataTypes),
  SnapshotSpace: SnapshotSpaceFactory(sequelize, DataTypes),
  Subscription: SubscriptionFactory(sequelize, DataTypes),
  TaggedThread: TaggedThreadFactory(sequelize, DataTypes),
  User: UserModelFactory(sequelize, DataTypes),
  Webhook: WebhookFactory(sequelize, DataTypes),
  CommunityStake: CommunityStakeFactory(sequelize, DataTypes),
  Outbox: OutboxFactory(sequelize, DataTypes),
};

export const models: DB = {
  sequelize,
  Sequelize,
  ..._models,
};

// setup associations
Object.keys(_models).forEach((key) => {
  const model = _models[key as keyof Models];
  'associate' in model && model.associate(models);
});
