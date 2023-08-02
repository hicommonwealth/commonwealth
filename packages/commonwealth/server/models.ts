import type { Sequelize } from 'sequelize';

import type { AddressModelStatic } from './models/address';
import type { BanModelStatic } from './models/ban';
import type { ChainModelStatic } from './models/chain';
import type { ChainEntityMetaModelStatic } from './models/chain_entity_meta';
import type { ChainNodeModelStatic } from './models/chain_node';
import type { CollaborationModelStatic } from './models/collaboration';
import type { CommentModelStatic } from './models/comment';
import type { CommunityBannerModelStatic } from './models/community_banner';
import type { CommunityContractModelStatic } from './models/community_contract';
import type { CommunitySnapshotSpaceModelStatic } from './models/community_snapshot_spaces';
import type { ContractModelStatic } from './models/contract';
import type { ContractAbiModelStatic } from './models/contract_abi';
import type { DiscordBotConfigModelStatic } from './models/discord_bot_config';
import type { LoginTokenModelStatic } from './models/login_token';
import type { NotificationModelStatic } from './models/notification';
import type { NotificationCategoryModelStatic } from './models/notification_category';
import type { NotificationsReadModelStatic } from './models/notifications_read';
import type { PollModelStatic } from './models/poll';
import type { ProfileModelStatic } from './models/profile';
import type { ReactionModelStatic } from './models/reaction';
import type { SnapshotProposalModelStatic } from './models/snapshot_proposal';
import type { SnapshotSpaceModelStatic } from './models/snapshot_spaces';
import type { SocialAccountModelStatic } from './models/social_account';
import type { SsoTokenModelStatic } from './models/sso_token';
import type { StarredCommunityModelStatic } from './models/starred_community';
import type { SubscriptionModelStatic } from './models/subscription';
import type { TaggedThreadModelStatic } from './models/tagged_threads';
import type { ThreadModelStatic } from './models/thread';
import type { TokenModelStatic } from './models/token';
import type { TopicModelStatic } from './models/topic';
import type { UserModelStatic } from './models/user';
import type { VoteModelStatic } from './models/vote';
import type { WebhookModelStatic } from './models/webhook';
import type { CommunityContractTemplateStatic } from './models/community_contract_template';
import type { CommunityContractTemplateMetadataStatic } from './models/community_contract_metadata';
import type { TemplateModelStatic } from './models/template';

export type Models = {
  Address: AddressModelStatic;
  Ban: BanModelStatic;
  Chain: ChainModelStatic;
  ChainEntityMeta: ChainEntityMetaModelStatic;
  ChainNode: ChainNodeModelStatic;
  Contract: ContractModelStatic;
  ContractAbi: ContractAbiModelStatic;
  CommunityContract: CommunityContractModelStatic;
  CommunityContractTemplate: CommunityContractTemplateStatic;
  CommunityContractTemplateMetadata: CommunityContractTemplateMetadataStatic;
  Template: TemplateModelStatic;
  CommunitySnapshotSpaces: CommunitySnapshotSpaceModelStatic;
  Collaboration: CollaborationModelStatic;
  CommunityBanner: CommunityBannerModelStatic;
  DiscordBotConfig: DiscordBotConfigModelStatic;
  LoginToken: LoginTokenModelStatic;
  Notification: NotificationModelStatic;
  NotificationCategory: NotificationCategoryModelStatic;
  NotificationsRead: NotificationsReadModelStatic;
  Comment: CommentModelStatic;
  Poll: PollModelStatic;
  Reaction: ReactionModelStatic;
  Thread: ThreadModelStatic;
  Topic: TopicModelStatic;
  Vote: VoteModelStatic;
  Profile: ProfileModelStatic;
  SocialAccount: SocialAccountModelStatic;
  SsoToken: SsoTokenModelStatic;
  StarredCommunity: StarredCommunityModelStatic;
  SnapshotProposal: SnapshotProposalModelStatic;
  Subscription: SubscriptionModelStatic;
  SnapshotSpace: SnapshotSpaceModelStatic;
  Token: TokenModelStatic;
  TaggedThread: TaggedThreadModelStatic;
  User: UserModelStatic;
  Webhook: WebhookModelStatic;
};

export interface DB extends Models {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}
