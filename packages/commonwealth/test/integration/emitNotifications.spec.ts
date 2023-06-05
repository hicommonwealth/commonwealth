import chai from 'chai';
import chaiHttp from 'chai-http';
import { resetDatabase } from '../../server-test';
import * as modelUtils from '../util/modelUtils';
import { JoinCommunityArgs } from '../util/modelUtils';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../server/config';
import emitNotifications from '../../server/util/emitNotifications';
import models from '../../server/database';
import { NotificationCategories, ProposalType } from 'common-common/src/types';
import {
  IPostNotificationData,
  SnapshotEventType,
  SnapshotNotification,
} from 'types';
import { Op, Sequelize } from 'sequelize';

chai.use(chaiHttp);
const { expect } = chai;

describe.only('emitNotifications tests', () => {
  const chain = 'ethereum';
  const chain2 = 'alex';
  // The createThread util uses the chainId parameter to determine
  // author_chain, which is required for authorship lookup.
  // Therefore, a valid chain MUST be included alongside
  // communityId, unlike in non-test thread creation
  let thread, comment, reaction;
  const title = 'test title';
  const body = 'test body';
  const commentBody = 'test';
  const topicName = 'test topic';
  const kind = 'discussion';

  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;
  let userJWT2;
  let userId2;
  let userAddress2;
  let userAddressId2;

  before('Reset database', async () => {
    await resetDatabase();

    // creates 2 ethereum users
    const firstUser = await modelUtils.createAndVerifyAddress({ chain });
    userId = firstUser.user_id;
    userAddress = firstUser.address;
    userAddressId = firstUser.address_id;
    userJWT = jwt.sign({ id: userId, email: firstUser.email }, JWT_SECRET);
    expect(userId).to.not.be.null;
    expect(userAddress).to.not.be.null;
    expect(userAddressId).to.not.be.null;
    expect(userJWT).to.not.be.null;

    const secondUser = await modelUtils.createAndVerifyAddress({
      chain: chain,
    });
    userId2 = secondUser.user_id;
    userAddress2 = secondUser.address;
    userAddressId2 = secondUser.address_id;
    userJWT2 = jwt.sign({ id: userId2, email: secondUser.email }, JWT_SECRET);
    expect(userId2).to.not.be.null;
    expect(userAddress2).to.not.be.null;
    expect(userAddressId2).to.not.be.null;
    expect(userJWT2).to.not.be.null;

    // make second user join alex community
    const communityArgs: JoinCommunityArgs = {
      jwt: userJWT2,
      address_id: userAddressId2,
      address: userAddress2,
      chain: chain2,
      originChain: chain,
    };
    const res = await modelUtils.joinCommunity(communityArgs);
    expect(res).to.equal(true);

    // sets user-2 to be admin of the alex community
    const isAdmin = await modelUtils.updateRole({
      address_id: userAddressId2,
      chainOrCommObj: { chain_id: chain2 },
      role: 'admin',
    });
    expect(isAdmin).to.not.be.null;

    // create a thread manually to bypass emitNotifications in-route
    thread = await models.Thread.create({
      chain: chain,
      address_id: userAddressId2,
      title,
      plaintext: '',
      kind,
    });

    comment = await models.Comment.create({
      thread_id: thread.id,
      address_id: userAddressId2,
      text: commentBody,
      chain,
    });

    reaction = await models.Reaction.create({
      chain,
      thread_id: thread.id,
      address_id: userAddressId,
      reaction: 'like',
    });
  });

  describe('PostNotificationData', () => {
    it('should generate a notification and notification reads for a new thread', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewThread,
        object_id: chain,
        chain_id: chain,
      });

      const notification_data: IPostNotificationData = {
        created_at: new Date(),
        thread_id: thread.id,
        root_type: ProposalType.Thread,
        root_title: title,
        chain_id: chain,
        author_address: userAddress2,
        author_chain: chain,
      };

      await emitNotifications(
        models,
        NotificationCategories.NewThread,
        chain,
        notification_data
      );

      const notif = await models.Notification.findOne({
        where: {
          chain_id: chain,
          category_id: NotificationCategories.NewThread,
          thread_id: thread.id,
        },
      });
      expect(notif).to.not.be.null;
      expect(notif.thread_id).to.equal(thread.id);
      expect(notif.toJSON().notification_data).to.deep.equal(
        JSON.stringify(notification_data)
      );

      const notifRead = await models.NotificationsRead.findOne({
        where: {
          subscription_id: subscription.id,
          notification_id: notif.id,
          user_id: userId,
          is_read: false,
        },
      });
      expect(notifRead).to.not.be.null;
    });

    it('should generate a notification and notification reads for a thread comment', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewComment,
        object_id: `discussion_${thread.id}`,
        chain_id: chain,
        offchain_thread_id: thread.id,
      });

      const notification_data: IPostNotificationData = {
        created_at: new Date(),
        thread_id: thread.id,
        root_type: ProposalType.Thread,
        root_title: title,
        comment_text: commentBody,
        chain_id: chain,
        author_address: userAddress2,
        author_chain: chain,
      };

      const object_id = `discussion_${thread.id}`;
      await emitNotifications(
        models,
        NotificationCategories.NewComment,
        `discussion_${thread.id}`,
        notification_data
      );

      const notif = await models.Notification.findOne({
        where: {
          chain_id: chain,
          category_id: NotificationCategories.NewComment,
        },
      });
      expect(notif).to.not.be.null;
      expect(notif.thread_id).to.equal(thread.id);
      expect(notif.toJSON().notification_data).to.deep.equal(
        JSON.stringify(notification_data)
      );

      const notifRead = await models.NotificationsRead.findOne({
        where: {
          subscription_id: subscription.id,
          notification_id: notif.id,
          user_id: userId,
          is_read: false,
        },
      });
      expect(notifRead).to.not.be.null;
    });

    it('should generate a notification and notification reads for a new thread reaction', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewReaction,
        object_id: `discussion_${thread.id}`,
        chain_id: chain,
        offchain_thread_id: thread.id,
      });

      const notification_data: IPostNotificationData = {
        created_at: new Date(),
        thread_id: thread.id,
        root_type: ProposalType.Thread,
        root_title: title,
        chain_id: chain,
        author_address: userAddress,
        author_chain: chain,
      };
      await emitNotifications(
        models,
        NotificationCategories.NewReaction,
        `discussion_${thread.id}`,
        notification_data
      );

      const notif = await models.Notification.findOne({
        where: {
          chain_id: chain,
          category_id: NotificationCategories.NewReaction,
          thread_id: thread.id,
        },
      });
      expect(notif).to.not.be.null;
      expect(notif.thread_id).to.equal(thread.id);
      expect(notif.toJSON().notification_data).to.deep.equal(
        JSON.stringify(notification_data)
      );

      const notifRead = await models.NotificationsRead.findOne({
        where: {
          subscription_id: subscription.id,
          notification_id: notif.id,
          user_id: userId,
          is_read: false,
        },
      });
      expect(notifRead).to.not.be.null;
    });
  });

  describe.only('SnapshotNotificationData', () => {
    it('should generate a notification for a new snapshot proposal', async () => {
      const space = 'plutusclub.eth';
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.SnapshotProposal,
        object_id: space,
        snapshot_id: space,
      });

      const snapshotNotificationData = {
        eventType: 'proposal/created',
        space,
        id: '0x8b65f5c841816e9fbe54da3fb79ab7abf3444ddc4ca228f97e8c347a53695a98',
        title: 'Drop confirm',
        body: '',
        choices: ['Yes', 'No'],
        start: 1680610125,
        expire: 1680869325,
      };

      const eventType: SnapshotEventType = SnapshotEventType.Created;
      const notififcation_data = {
        eventType,
        ...snapshotNotificationData,
      } as unknown as SnapshotNotification & { eventType: SnapshotEventType };

      await emitNotifications(
        models,
        NotificationCategories.SnapshotProposal,
        snapshotNotificationData.space,
        notififcation_data,
        {
          notificationCategory: eventType,
          body: snapshotNotificationData.body,
          title: snapshotNotificationData.title,
        }
      );

      const notif = await models.Notification.findOne({
        where: {
          category_id: NotificationCategories.SnapshotProposal,
        },
      });
      expect(notif).to.exist;
    });
  });
});
