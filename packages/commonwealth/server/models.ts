import { Sequelize } from 'sequelize';

import { AddressModelStatic } from './models/address';
import {
  AttachmentModelStatic
} from './models/attachment';
import { BanModelStatic } from './models/ban';
import { ChainModelStatic } from './models/chain';
import {
  ChainCategoryModelStatic
} from './models/chain_category';
import {
  ChainCategoryTypeModelStatic
} from './models/chain_category_type';
import {
  ChainEntityModelStatic
} from './models/chain_entity';
import { ChainEventModelStatic } from './models/chain_event';
import {
  ChainEventTypeModelStatic
} from './models/chain_event_type';
import { ChainNodeModelStatic } from './models/chain_node';
import { ChatChannelModelStatic } from './models/chat_channel';
import {
  ChatMessageModelStatic
} from './models/chat_message';
import {
  CollaborationModelStatic
} from './models/collaboration';
import {
  CommentModelStatic
} from './models/comment';
import { CommunityBannerModelStatic } from './models/community_banner';
import { CommunityContractModelStatic } from './models/community_contract';
import { ContractModelStatic } from './models/contract';
import { ContractAbiModelStatic } from './models/contract_abi';
import {
  DiscussionDraftModelStatic
} from './models/discussion_draft';
import {
  IdentityCacheStatic
} from './models/identity_cache';
import { InviteCodeModelStatic } from './models/invite_code';
import { IpfsPinsModelStatic } from './models/ipfs_pins';
import { LinkedThreadModelStatic } from './models/linked_thread';
import { LoginTokenModelStatic } from './models/login_token';
import {
  NotificationModelStatic
} from './models/notification';
import {
  NotificationsReadModelStatic
} from './models/notifications_read';
import {
  NotificationCategoryModelStatic
} from './models/notification_category';
import {
  OffchainProfileModelStatic
} from './models/offchain_profile';
import {
  PollModelStatic
} from './models/poll';
import { ProfileModelStatic } from './models/profile';
import {
  ReactionModelStatic
} from './models/reaction';
import { RoleModelStatic } from './models/role';
import { RuleModelStatic } from './models/rule';
import {
  SocialAccountModelStatic
} from './models/social_account';
import { SsoTokenModelStatic } from './models/sso_token';
import {
  StarredCommunityModelStatic
} from './models/starred_community';
import {
  SubscriptionModelStatic
} from './models/subscription';
import {
  TaggedThreadModelStatic
} from './models/tagged_threads';
import {
  ThreadModelStatic
} from './models/thread';
import { TokenModelStatic } from './models/token';
import {
  TopicModelStatic
} from './models/topic';
import { UserModelStatic } from './models/user';
import {
  ViewCountModelStatic
} from './models/viewcount';
import {
  VoteModelStatic
} from './models/vote';
import {
  WaitlistRegistrationModelStatic
} from './models/waitlist_registration';
import { WebhookModelStatic } from './models/webhook';

export type Models = {
  Address: AddressModelStatic;
  Ban: BanModelStatic;
  Chain: ChainModelStatic;
  ChainCategory: ChainCategoryModelStatic;
  ChainCategoryType: ChainCategoryTypeModelStatic;
  ChainEntity: ChainEntityModelStatic;
  ChainEvent: ChainEventModelStatic;
  ChainEventType: ChainEventTypeModelStatic;
  ChainNode: ChainNodeModelStatic;
  ChatChannel: ChatChannelModelStatic;
  ChatMessage: ChatMessageModelStatic;
  Contract: ContractModelStatic;
  ContractAbi: ContractAbiModelStatic;
  CommunityContract: CommunityContractModelStatic;
  Collaboration: CollaborationModelStatic;
  CommunityBanner: CommunityBannerModelStatic;
  DiscussionDraft: DiscussionDraftModelStatic;
  IdentityCache: IdentityCacheStatic;
  InviteCode: InviteCodeModelStatic;
  IpfsPins: IpfsPinsModelStatic;
  LinkedThread: LinkedThreadModelStatic;
  LoginToken: LoginTokenModelStatic;
  Notification: NotificationModelStatic;
  NotificationCategory: NotificationCategoryModelStatic;
  NotificationsRead: NotificationsReadModelStatic;
  Attachment: AttachmentModelStatic;
  Comment: CommentModelStatic;
  Poll: PollModelStatic;
  OffchainProfile: OffchainProfileModelStatic;
  Reaction: ReactionModelStatic;
  Thread: ThreadModelStatic;
  Topic: TopicModelStatic;
  ViewCount: ViewCountModelStatic;
  Vote: VoteModelStatic;
  Profile: ProfileModelStatic;
  Role: RoleModelStatic;
  Rule: RuleModelStatic;
  SocialAccount: SocialAccountModelStatic;
  SsoToken: SsoTokenModelStatic;
  StarredCommunity: StarredCommunityModelStatic;
  Subscription: SubscriptionModelStatic;
  Token: TokenModelStatic;
  TaggedThread: TaggedThreadModelStatic;
  User: UserModelStatic;
  WaitlistRegistration: WaitlistRegistrationModelStatic;
  Webhook: WebhookModelStatic;
};

export interface DB extends Models {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}
