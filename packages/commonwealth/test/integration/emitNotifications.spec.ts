import {
  NotificationCategories,
  ProposalType,
  SupportedNetwork,
} from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { NotificationDataAndCategory, SnapshotEventType } from 'types';
import { resetDatabase } from '../../server-test';
import { JWT_SECRET } from '../../server/config';
import models from '../../server/database';
import emitNotifications from '../../server/util/emitNotifications';
import * as modelUtils from '../util/modelUtils';
import { JoinCommunityArgs } from '../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('emitNotifications tests', () => {
  const chain = 'ethereum';
  const chain2 = 'alex';
  // The createThread util uses the chainId parameter to determine
  // author_chain, which is required for authorship lookup.
  // Therefore, a valid chain MUST be included alongside
  // communityId, unlike in non-test thread creation
  let thread, comment;
  //reaction;
  const title = 'test title';
  // const body = 'test body';
  const commentBody = 'test';
  // const topicName = 'test topic';
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
      chainOrCommObj: { chain_id: chain },
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

    //reaction = await models.Reaction.create({
    await models.Reaction.create({
      chain,
      thread_id: thread.id,
      address_id: userAddressId,
      reaction: 'like',
    });
  });

  describe('Forum Notifications', () => {
    it('should generate a notification and notification reads for a new thread', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewThread,
        chain_id: chain,
      });

      const notification_data = {
        created_at: new Date(),
        thread_id: thread.id,
        root_type: ProposalType.Thread,
        root_title: title,
        comment_text: '',
        chain_id: chain,
        author_address: userAddress2,
        author_chain: chain,
      };

      await emitNotifications(models, {
        categoryId: NotificationCategories.NewThread,
        data: notification_data,
      });

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
        JSON.stringify(notification_data),
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

      //verify max_notif_id in thread is updated
      const updatedThread = await models.Thread.findOne({
        where: {
          id: thread.id,
        },
      });
      expect(updatedThread.max_notif_id).to.equal(notif.id);
    });

    it('should generate a notification and notification reads for a thread comment', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewComment,
        chain_id: chain,
        thread_id: thread.id,
      });

      const notifData = {
        created_at: new Date(),
        thread_id: thread.id,
        root_type: ProposalType.Thread,
        root_title: title,
        comment_id: comment.id,
        comment_text: commentBody,
        chain_id: chain,
        author_address: userAddress2,
        author_chain: chain,
      };
      await emitNotifications(models, {
        categoryId: NotificationCategories.NewComment,
        data: notifData,
      });

      const notif = await models.Notification.findOne({
        where: {
          chain_id: chain,
          category_id: NotificationCategories.NewComment,
        },
      });
      expect(notif).to.not.be.null;
      expect(notif.thread_id).to.equal(thread.id);
      expect(notif.toJSON().notification_data).to.deep.equal(
        JSON.stringify(notifData),
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

      //verify max_notif_id in thread model is updated
      const updatedThread = await models.Thread.findOne({
        where: {
          id: thread.id,
        },
      });
      expect(updatedThread.max_notif_id).to.equal(notif.id);
    });

    it('should generate a notification and notification reads for a new thread reaction', async () => {
      let updatedThread = await models.Thread.findOne({
        where: {
          id: thread.id,
        },
      });
      const before_thread_max_notif_id = updatedThread.max_notif_id;
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewReaction,
        chain_id: chain,
        thread_id: thread.id,
      });

      const notification_data = {
        created_at: new Date(),
        thread_id: thread.id,
        root_type: ProposalType.Thread,
        root_title: title,
        chain_id: chain,
        author_address: userAddress,
        author_chain: chain,
      };
      await emitNotifications(models, {
        categoryId: NotificationCategories.NewReaction,
        data: notification_data,
      });

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
        JSON.stringify(notification_data),
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

      // verify max_notif_id in thread is not updated on new reaction
      // currently updating only on new thread and new comment
      updatedThread = await models.Thread.findOne({
        where: {
          id: thread.id,
        },
      });
      expect(updatedThread.max_notif_id).to.equal(before_thread_max_notif_id);
    });

    it('should generate a notification and notification read for a new mention', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewMention,
      });

      const notification_data: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewMention,
        data: {
          created_at: new Date(),
          thread_id: thread.id,
          root_type: ProposalType.Thread,
          root_title: title,
          chain_id: chain,
          author_address: userAddress,
          author_chain: chain,
          mentioned_user_id: userId,
          comment_text: '',
        },
      };
      await emitNotifications(models, notification_data);

      const notif = await models.Notification.findOne({
        where: {
          category_id: NotificationCategories.NewMention,
        },
      });
      expect(notif).to.not.be.null;
      expect(JSON.parse(notif.notification_data).thread_id).to.equal(thread.id);

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

    it('should generate a notification and notification read for a new collaboration', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.NewCollaboration,
      });

      const notification_data: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewCollaboration,
        data: {
          created_at: new Date(),
          thread_id: thread.id,
          root_type: ProposalType.Thread,
          root_title: title,
          chain_id: chain,
          author_address: userAddress,
          author_chain: chain,
          comment_text: '',
          collaborator_user_id: userId,
        },
      };
      await emitNotifications(models, notification_data);

      const notif = await models.Notification.findOne({
        where: {
          category_id: NotificationCategories.NewCollaboration,
        },
      });
      expect(notif).to.not.be.null;
      expect(JSON.parse(notif.notification_data).thread_id).to.equal(thread.id);

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

  describe('Snapshot Notifications', () => {
    it('should generate a notification for a new snapshot proposal', async () => {
      const space = 'plutusclub.eth';
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.SnapshotProposal,
        snapshot_id: space,
      });

      const snapshotNotificationData = {
        eventType: SnapshotEventType.Created,
        space,
        id: '0x8b65f5c841816e9fbe54da3fb79ab7abf3444ddc4ca228f97e8c347a53695a98',
        title: 'Drop confirm',
        body: '',
        choices: ['Yes', 'No'],
        start: String(1680610125),
        expire: String(1680869325),
      };

      // const eventType: SnapshotEventType = SnapshotEventType.Created;
      const notififcation_data: NotificationDataAndCategory = {
        categoryId: NotificationCategories.SnapshotProposal,
        data: {
          ...snapshotNotificationData,
        },
      };

      await emitNotifications(models, notififcation_data);

      const notif = await models.Notification.findOne({
        where: {
          category_id: NotificationCategories.SnapshotProposal,
        },
      });

      expect(notif).to.exist;

      const notifRead = await models.NotificationsRead.findOne({
        where: {
          subscription_id: subscription.id,
          notification_id: notif.id,
          user_id: userId,
        },
      });

      expect(notifRead).to.exist;
    });
  });

  describe('Chain Event Notifications', () => {
    it('should generate a notification and notification reads for a new chain event', async () => {
      const subscription = await models.Subscription.create({
        subscriber_id: userId,
        category_id: NotificationCategories.ChainEvent,
        chain_id: chain,
      });

      const chainEventId = -1;
      const notification_data = {
        id: chainEventId,
        block_number: 10,
        event_data: '',
        queued: 1,
        network: SupportedNetwork.Compound,
        chain: chain,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await emitNotifications(models, {
        categoryId: NotificationCategories.ChainEvent,
        data: notification_data,
      });

      const notif = await models.Notification.findOne({
        where: {
          chain_id: chain,
          category_id: NotificationCategories.ChainEvent,
          chain_event_id: chainEventId,
        },
      });
      expect(notif).to.exist;

      const notifRead = await models.NotificationsRead.findOne({
        where: {
          subscription_id: subscription.id,
          notification_id: notif.id,
          user_id: userId,
        },
      });
      expect(notifRead).to.exist;
    });
  });
});
