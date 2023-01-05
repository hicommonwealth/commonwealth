import SequelizeMock from 'sequelize-mock';
import { Sequelize, DataTypes } from 'sequelize';
import { DB } from 'server/models';
import { MockAddress } from './mock_address';

const sequelizeMock = new SequelizeMock();

const fakeSequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres',
});

const UserMock = sequelizeMock.define(
  'user',
  {
    email: 'test@example.com',
    isAdmin: false,
  },
  {
    instanceMethods: {
      getEmail() {
        return `${this.email}`;
      },
    },
  }
);

const AddressMock = new MockAddress(sequelizeMock).getModel();

const models = {
  Address: AddressMock,
  Ban: null,
  Chain: null,
  ChainCategory: null,
  ChainCategoryType: null,
  ChainNode: null,
  ChatChannel: null,
  ChainEntityMeta: null,
  ChainEventType: null,
  ChatMessage: null,
  Collaboration: null,
  Contract: null,
  ContractAbi: null,
  CommunityContract: null,
  CommunityBanner: null,
  CommunityRole: null,
  DiscussionDraft: null,
  IdentityCache: null,
  InviteCode: null,
  LinkedThread: null,
  LoginToken: null,
  Notification: null,
  NotificationCategory: null,
  NotificationsRead: null,
  Attachment: null,
  Comment: null,
  Poll: null,
  OffchainProfile: null,
  Reaction: null,
  Thread: null,
  Topic: null,
  ViewCount: null,
  Vote: null,
  Profile: null,
  Role: null,
  RoleAssignment: null,
  Rule: null,
  SocialAccount: null,
  SsoToken: null,
  StarredCommunity: null,
  Subscription: null,
  Token: null,
  TaggedThread: null,
  User: UserMock,
  WaitlistRegistration: null,
  Webhook: null,
  CommunitySnapshotSpaces: undefined,
  DiscordBotConfig: undefined,
  SnapshotProposal: undefined,
  SnapshotSpace: undefined,
};

// The fields sequelize and Sequelize are required for the DB interface, but for mocking we don't need to use them
export const mockDb: DB = {
  sequelize: fakeSequelize,
  Sequelize: sequelizeMock,
  ...models,
};
