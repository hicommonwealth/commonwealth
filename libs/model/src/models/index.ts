import { DataTypes, Sequelize } from 'sequelize';

import AddressFactory, { type AddressModelStatic } from './address';
import BanFactory, { type BanModelStatic } from './ban';
import ChainNodeFactory, { type ChainNodeModelStatic } from './chain_node';
import CollaborationFactory, {
  type CollaborationModelStatic,
} from './collaboration';
import CommentFactory, { type CommentModelStatic } from './comment';
import CommunityFactory, { type CommunityModelStatic } from './community';
import CommunityBannerFactory, {
  type CommunityBannerModelStatic,
} from './community_banner';
import CommunityContractFactory, {
  type CommunityContractModelStatic,
} from './community_contract';
import CommunityContractTemplateMetadataFactory, {
  type CommunityContractTemplateMetadataStatic,
} from './community_contract_metadata';
import CommunityContractTemplateFactory, {
  type CommunityContractTemplateStatic,
} from './community_contract_template';
import CommunitySnapshotSpaceFactory, {
  type CommunitySnapshotSpaceModelStatic,
} from './community_snapshot_spaces';
import CommunityStakeFactory, {
  type CommunityStakeModelStatic,
} from './community_stake';
import ContractFactory, { type ContractModelStatic } from './contract';
import ContractAbiFactory, {
  type ContractAbiModelStatic,
} from './contract_abi';
import DiscordBotConfigFactory, {
  type DiscordBotConfigModelStatic,
} from './discord_bot_config';
import EvmEventSourceFactory, {
  type EvmEventSourceModelStatic,
} from './evmEventSource';
import GroupFactory, { type GroupModelStatic } from './group';
import LastProcessedEvmBlockFactory, {
  type LastProcessedEvmBlockModelStatic,
} from './lastProcessedEvmBlock';
import LoginTokenFactory, { type LoginTokenModelStatic } from './login_token';
import MembershipFactory, { type MembershipModelStatic } from './membership';
import NotificationFactory, {
  type NotificationModelStatic,
} from './notification';
import NotificationCategoryFactory, {
  type NotificationCategoryModelStatic,
} from './notification_category';
import NotificationsReadFactory, {
  type NotificationsReadModelStatic,
} from './notifications_read';
// import OutboxFactory, { type OutboxModelStatic } from './outbox';
import PollFactory, { type PollModelStatic } from './poll';
import ProfileFactory, { type ProfileModelStatic } from './profile';
import ReactionFactory, { type ReactionModelStatic } from './reaction';
import SnapshotProposalFactory, {
  type SnapshotProposalModelStatic,
} from './snapshot_proposal';
import SnapshotSpaceFactory, {
  type SnapshotSpaceModelStatic,
} from './snapshot_spaces';
import SsoTokenFactory, { type SsoTokenModelStatic } from './sso_token';
import StarredCommunityFactory, {
  type StarredCommunityModelStatic,
} from './starred_community';
import SubscriptionFactory, {
  type SubscriptionModelStatic,
} from './subscription';
import TemplateFactory, { type TemplateModelStatic } from './template';
import ThreadFactory, { type ThreadModelStatic } from './thread';
import TopicFactory, { type TopicModelStatic } from './topic';
import UserFactory, { type UserModelStatic } from './user';
import VoteFactory, { type VoteModelStatic } from './vote';
import WebhookFactory, { type WebhookModelStatic } from './webhook';

export type Models = {
  Address: AddressModelStatic;
  Ban: BanModelStatic;
  Community: CommunityModelStatic;
  ChainNode: ChainNodeModelStatic;
  Contract: ContractModelStatic;
  ContractAbi: ContractAbiModelStatic;
  CommunityContract: CommunityContractModelStatic;
  CommunityContractTemplate: CommunityContractTemplateStatic;
  CommunityContractTemplateMetadata: CommunityContractTemplateMetadataStatic;
  CommunityStake: CommunityStakeModelStatic;
  Template: TemplateModelStatic;
  CommunitySnapshotSpaces: CommunitySnapshotSpaceModelStatic;
  Collaboration: CollaborationModelStatic;
  CommunityBanner: CommunityBannerModelStatic;
  DiscordBotConfig: DiscordBotConfigModelStatic;
  EvmEventSource: EvmEventSourceModelStatic;
  LastProcessedEvmBlock: LastProcessedEvmBlockModelStatic;
  LoginToken: LoginTokenModelStatic;
  Notification: NotificationModelStatic;
  NotificationCategory: NotificationCategoryModelStatic;
  NotificationsRead: NotificationsReadModelStatic;
  Comment: CommentModelStatic;
  Poll: PollModelStatic;
  Group: GroupModelStatic;
  Membership: MembershipModelStatic;
  Reaction: ReactionModelStatic;
  Thread: ThreadModelStatic;
  Topic: TopicModelStatic;
  Vote: VoteModelStatic;
  Profile: ProfileModelStatic;
  SsoToken: SsoTokenModelStatic;
  StarredCommunity: StarredCommunityModelStatic;
  SnapshotProposal: SnapshotProposalModelStatic;
  Subscription: SubscriptionModelStatic;
  SnapshotSpace: SnapshotSpaceModelStatic;
  User: UserModelStatic;
  Webhook: WebhookModelStatic;
  // Outbox: OutboxModelStatic;
};

export type DB = Models & {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
};

export const buildDb = (sequelize: Sequelize): DB => {
  const entities = {
    Address: AddressFactory(sequelize, DataTypes),
    Ban: BanFactory(sequelize, DataTypes),
    Community: CommunityFactory(sequelize, DataTypes),
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
    CommunitySnapshotSpaces: CommunitySnapshotSpaceFactory(
      sequelize,
      DataTypes,
    ),
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
    User: UserFactory(sequelize, DataTypes),
    Webhook: WebhookFactory(sequelize, DataTypes),
    CommunityStake: CommunityStakeFactory(sequelize, DataTypes),
    // Outbox: OutboxFactory(sequelize, DataTypes),
  };

  const db = {
    sequelize,
    Sequelize,
    ...entities,
  };

  // setup associations
  Object.keys(entities).forEach((key) => {
    const model = entities[key as keyof Models];
    'associate' in model && model.associate(db);
  });

  return db;
};

export * from './address';
export * from './ban';
export * from './chain_node';
export * from './collaboration';
export * from './comment';
export * from './community';
export * from './community_banner';
export * from './community_contract';
export * from './community_contract_metadata';
export * from './community_contract_template';
export * from './community_role';
export * from './community_snapshot_spaces';
export * from './community_stake';
export * from './contract';
export * from './contract_abi';
export * from './discord_bot_config';
export * from './evmEventSource';
export * from './group';
export * from './lastProcessedEvmBlock';
export * from './login_token';
export * from './membership';
export * from './notification';
export * from './notification_category';
export * from './notifications_read';
export * from './outbox';
export * from './poll';
export * from './profile';
export * from './reaction';
export * from './role';
export * from './role_assignment';
export * from './snapshot_proposal';
export * from './snapshot_spaces';
export * from './sso_token';
export * from './starred_community';
export * from './subscription';
export * from './template';
export * from './thread';
export * from './topic';
export * from './types';
export * from './user';
export * from './vote';
export * from './webhook';
