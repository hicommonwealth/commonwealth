import SequelizeMock from 'sequelize-mock';
import { Sequelize, DataTypes } from 'sequelize';
import { DB } from 'server/models';

export const sequelizeMock = new SequelizeMock();

const fakeSequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres'
});

export const UserMock = sequelizeMock.define(
  'user',
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'test@example.com',
  },
  {
    instanceMethods: {
      getFullName() {
        return `${this.get('firstName')} ${this.get('lastName')}`;
      },
    },
  }
);

// From there we can start using it like a normal model
UserMock.findOne({
  where: {
    username: 'my-user',
  },
}).then(function (user) {
  // `user` is a Sequelize Model-like object
  console.log(user.get('id')); // Auto-Incrementing ID available on all Models
  user.get('email'); // 'email@example.com'; Pulled from default values
  user.get('username'); // 'my-user'; Pulled from the `where` in the query
});

const models = {
  Address: null,
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
};

// The fields sequelize and Sequelize are required for the DB interface, but for mocking we don't need to use them
export const mockDb: DB = {
  sequelize: fakeSequelize,
  Sequelize: sequelizeMock,
  ...models,
};
