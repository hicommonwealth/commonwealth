import { DataTypes, Sequelize } from 'sequelize';
import { DATABASE_URI } from './config';

import type { DB, Models } from './models';
import AddressFactory from './models/address';
import AttachmentFactory from './models/attachment';
import BanFactory from './models/ban';
import ChainFactory from './models/chain';
import ChainCategoryFactory from './models/chain_category';
import ChainCategoryTypeFactory from './models/chain_category_type';
import ChainEntityMetaFactory from './models/chain_entity_meta';
import ChainEventTypeFactory from './models/chain_event_type';
import ChainNodeFactory from './models/chain_node';
import ChatChannelFactory from './models/chat_channel';
import ChatMessageFactory from './models/chat_message';
import CollaborationFactory from './models/collaboration';
import CommentFactory from './models/comment';
import CommunityBannerFactory from './models/community_banner';
import CommunityContractFactory from './models/community_contract';
import CommunityRoleFactory from './models/community_role';
import CommunitySnapshotSpaceFactory from './models/community_snapshot_spaces';
import ContractFactory from './models/contract';
import ContractAbiFactory from './models/contract_abi';
import DiscordBotConfigFactory from './models/discord_bot_config';
import DiscussionDraftFactory from './models/discussion_draft';
import LinkedThread from './models/linked_thread';
import LoginTokenFactory from './models/login_token';
import NotificationFactory from './models/notification';
import NotificationCategoryFactory from './models/notification_category';
import NotificationsReadFactory from './models/notifications_read';
import OffchainProfileFactory from './models/offchain_profile';
import PollFactory from './models/poll';
import ProfileFactory from './models/profile';
import ReactionFactory from './models/reaction';
import RoleFactory from './models/role';
import RoleAssignmentFactory from './models/role_assignment';
import RuleFactory from './models/rule';
import SnapshotProposalFactory from './models/snapshot_proposal';
import SnapshotSpaceFactory from './models/snapshot_spaces';
import SocialAccountFactory from './models/social_account';
import SsoTokenFactory from './models/sso_token';
import StarredCommunityFactory from './models/starred_community';
import SubscriptionFactory from './models/subscription';
import TaggedThreadFactory from './models/tagged_threads';
import ThreadFactory from './models/thread';
import TokenFactory from './models/token';
import TopicFactory from './models/topic';
import UserModelFactory from './models/user';
import ViewCountFactory from './models/viewcount';
import VoteFactory from './models/vote';
import WebhookFactory from './models/webhook';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

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
    process.env.NODE_ENV !== 'production'
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

const models: Models = {
  Address: AddressFactory(sequelize, DataTypes),
  Ban: BanFactory(sequelize, DataTypes),
  Chain: ChainFactory(sequelize, DataTypes),
  ChainCategory: ChainCategoryFactory(sequelize, DataTypes),
  ChainCategoryType: ChainCategoryTypeFactory(sequelize, DataTypes),
  ChainNode: ChainNodeFactory(sequelize, DataTypes),
  ChatChannel: ChatChannelFactory(sequelize, DataTypes),
  ChainEntityMeta: ChainEntityMetaFactory(sequelize, DataTypes),
  ChainEventType: ChainEventTypeFactory(sequelize, DataTypes),
  ChatMessage: ChatMessageFactory(sequelize, DataTypes),
  Collaboration: CollaborationFactory(sequelize, DataTypes),
  Contract: ContractFactory(sequelize, DataTypes),
  ContractAbi: ContractAbiFactory(sequelize, DataTypes),
  CommunityContract: CommunityContractFactory(sequelize, DataTypes),
  CommunityBanner: CommunityBannerFactory(sequelize, DataTypes),
  CommunityRole: CommunityRoleFactory(sequelize, DataTypes),
  CommunitySnapshotSpaces: CommunitySnapshotSpaceFactory(sequelize, DataTypes),
  DiscussionDraft: DiscussionDraftFactory(sequelize, DataTypes),
  DiscordBotConfig: DiscordBotConfigFactory(sequelize, DataTypes),
  LinkedThread: LinkedThread(sequelize, DataTypes),
  LoginToken: LoginTokenFactory(sequelize, DataTypes),
  Notification: NotificationFactory(sequelize, DataTypes),
  NotificationCategory: NotificationCategoryFactory(sequelize, DataTypes),
  NotificationsRead: NotificationsReadFactory(sequelize, DataTypes),
  Attachment: AttachmentFactory(sequelize, DataTypes),
  Comment: CommentFactory(sequelize, DataTypes),
  Poll: PollFactory(sequelize, DataTypes),
  OffchainProfile: OffchainProfileFactory(sequelize, DataTypes),
  Reaction: ReactionFactory(sequelize, DataTypes),
  Thread: ThreadFactory(sequelize, DataTypes),
  Topic: TopicFactory(sequelize, DataTypes),
  ViewCount: ViewCountFactory(sequelize, DataTypes),
  Vote: VoteFactory(sequelize, DataTypes),
  Profile: ProfileFactory(sequelize, DataTypes),
  Role: RoleFactory(sequelize, DataTypes),
  RoleAssignment: RoleAssignmentFactory(sequelize, DataTypes),
  Rule: RuleFactory(sequelize, DataTypes),
  SocialAccount: SocialAccountFactory(sequelize, DataTypes),
  SsoToken: SsoTokenFactory(sequelize, DataTypes),
  StarredCommunity: StarredCommunityFactory(sequelize, DataTypes),
  SnapshotProposal: SnapshotProposalFactory(sequelize, DataTypes),
  SnapshotSpace: SnapshotSpaceFactory(sequelize, DataTypes),
  Subscription: SubscriptionFactory(sequelize, DataTypes),
  Token: TokenFactory(sequelize, DataTypes),
  TaggedThread: TaggedThreadFactory(sequelize, DataTypes),
  User: UserModelFactory(sequelize, DataTypes),
  Webhook: WebhookFactory(sequelize, DataTypes),
};

const db: DB = {
  sequelize,
  Sequelize,
  ...models,
};

// setup associations
Object.keys(models).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

export default db;
