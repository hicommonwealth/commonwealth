/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotificationCategories } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { findSubscription, SubUniqueData } from 'helpers/findSubscription';
import Comment from 'models/Comment';
import NotificationSubscription from 'models/NotificationSubscription';
import Thread from 'models/Thread';
import { describe, test } from 'vitest';

chai.use(chaiHttp);
const { expect } = chai;

const communityId = 'ethereum';
const snapshotId = 'snapshot_space';
const commentId = 1,
  threadId = 1;
const fakeComment = <Comment<any>>{
  id: 2,
};
const notifSubscriptions: NotificationSubscription[] = [
  new NotificationSubscription(
    1,
    NotificationCategories.ChainEvent,
    true,
    new Date(),
    false,
    'randomChain',
  ),
  new NotificationSubscription(
    2,
    NotificationCategories.ChainEvent,
    true,
    new Date(),
    false,
    communityId,
  ),
  new NotificationSubscription(
    3,
    NotificationCategories.NewThread,
    true,
    new Date(),
    false,
    'randomChain2',
  ),
  new NotificationSubscription(
    4,
    NotificationCategories.NewThread,
    true,
    new Date(),
    false,
    communityId,
  ),
  new NotificationSubscription(
    5,
    NotificationCategories.SnapshotProposal,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    null,
    null,
    'random_snapshot_space',
  ),
  new NotificationSubscription(
    6,
    NotificationCategories.SnapshotProposal,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    null,
    null,
    snapshotId,
  ),
  new NotificationSubscription(
    7,
    NotificationCategories.NewComment,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    <Comment<any>>{
      id: 2,
    },
    null,
  ),
  new NotificationSubscription(
    8,
    NotificationCategories.NewComment,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    <Comment<any>>{
      id: commentId,
    },
    null,
  ),
  new NotificationSubscription(
    9,
    NotificationCategories.NewComment,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    null,
    <Thread>{
      id: 2,
    },
  ),
  new NotificationSubscription(
    10,
    NotificationCategories.NewComment,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    null,
    <Thread>{
      id: threadId,
    },
  ),
  new NotificationSubscription(
    11,
    NotificationCategories.NewReaction,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    <Comment<any>>{
      id: 2,
    },
    null,
  ),
  new NotificationSubscription(
    12,
    NotificationCategories.NewReaction,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    <Comment<any>>{
      id: commentId,
    },
    null,
  ),
  new NotificationSubscription(
    13,
    NotificationCategories.NewReaction,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    null,
    <Thread>{
      id: 2,
    },
  ),
  new NotificationSubscription(
    14,
    NotificationCategories.NewReaction,
    true,
    new Date(),
    false,
    // @ts-expect-error StrictNullChecks
    null,
    null,
    <Thread>{
      id: threadId,
    },
  ),
  new NotificationSubscription(
    15,
    NotificationCategories.NewMention,
    true,
    new Date(),
    false,
  ),
  new NotificationSubscription(
    16,
    NotificationCategories.NewCollaboration,
    true,
    new Date(),
    false,
  ),
  new NotificationSubscription(
    17,
    NotificationCategories.ThreadEdit,
    true,
    new Date(),
    false,
  ),
  new NotificationSubscription(
    18,
    NotificationCategories.CommentEdit,
    true,
    new Date(),
    false,
  ),
];

describe('findSubscription tests', () => {
  describe(`${NotificationCategories.ChainEvent} subscriptions`, () => {
    test(`should return null if no chainId is provided`, () => {
      const findOptions = {
        categoryId: NotificationCategories.ChainEvent,
        options: {},
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(
        <SubUniqueData>findOptions,
        notifSubscriptions,
      );
      expect(result).to.be.undefined;
    });

    test('should return the correct subscription if a chainId is provided', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.ChainEvent,
        options: { communityId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.communityId).to.equal(communityId);
      expect(result.id).to.equal(2);
    });
  });

  describe(`${NotificationCategories.NewThread} subscriptions`, () => {
    test(`should return null if no chainId is provided`, () => {
      const findOptions = {
        categoryId: NotificationCategories.NewThread,
        options: {},
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(
        <SubUniqueData>findOptions,
        notifSubscriptions,
      );
      expect(result).to.be.undefined;
    });

    test('should return the correct subscription if a chainId', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.NewThread,
        options: { communityId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.communityId).to.equal(communityId);
      expect(result.id).to.equal(4);
    });
  });

  describe(`${NotificationCategories.SnapshotProposal} subscriptions`, () => {
    test(`should return null if no snapshotId is provided`, () => {
      const findOptions = {
        categoryId: NotificationCategories.SnapshotProposal,
        options: {},
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(
        <SubUniqueData>findOptions,
        notifSubscriptions,
      );
      expect(result).to.be.undefined;
    });

    test('should return the correct subscription if a chainId', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.SnapshotProposal,
        options: { snapshotId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.snapshotId).to.equal(snapshotId);
      expect(result.id).to.equal(6);
    });
  });

  describe(`${NotificationCategories.NewComment} subscriptions`, () => {
    test(`should return null if no threadId or commentId is provided`, () => {
      const findOptions = {
        categoryId: NotificationCategories.NewComment,
        options: {},
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(
        <SubUniqueData>findOptions,
        notifSubscriptions,
      );
      expect(result).to.be.undefined;
    });

    test(`should return null if both a threadId and commentId are provided`, () => {
      const findOptions = {
        categoryId: NotificationCategories.NewComment,
        options: { threadId, commentId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(
        <SubUniqueData>findOptions,
        notifSubscriptions,
      );
      expect(result).to.be.undefined;
    });

    test('should return the correct subscription if a threadId is provided', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.NewComment,
        options: { threadId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.threadId).to.equal(threadId);
      expect(result.commentId).to.be.undefined;
      expect(result.id).to.equal(10);
    });

    test('should return the correct subscription if a commentId is provided', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.NewComment,
        options: { commentId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.commentId).to.equal(commentId);
      expect(result.threadId).to.be.undefined;
      expect(result.id).to.equal(8);
    });
  });

  describe(`${NotificationCategories.NewReaction} subscriptions`, () => {
    test(`should return null if no threadId or commentId is provided`, () => {
      const findOptions = {
        categoryId: NotificationCategories.NewReaction,
        options: {},
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(
        <SubUniqueData>findOptions,
        notifSubscriptions,
      );
      expect(result).to.be.undefined;
    });

    test(`should return null if both a threadId and commentId are provided`, () => {
      const findOptions = {
        categoryId: NotificationCategories.NewReaction,
        options: { threadId, commentId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(
        <SubUniqueData>findOptions,
        notifSubscriptions,
      );
      expect(result).to.be.undefined;
    });

    test('should return the correct subscription if a threadId is provided', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.NewReaction,
        options: { threadId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.threadId).to.equal(threadId);
      expect(result.commentId).to.be.undefined;
      expect(result.id).to.equal(14);
    });

    test('should return the correct subscription if a commentId is provided', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.NewReaction,
        options: { commentId },
      };

      // type coercion necessary here since type error would usually be thrown to stop us from not passing a chain
      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.commentId).to.equal(commentId);
      expect(result.threadId).to.be.undefined;
      expect(result.id).to.equal(12);
    });
  });

  describe(`${NotificationCategories.NewMention} subscriptions`, () => {
    test('should return the subscription if it exists', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.NewMention,
        options: {},
      };

      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.id).to.equal(15);
    });
  });

  describe(`${NotificationCategories.NewCollaboration} subscriptions`, () => {
    test('should return the subscription if it exists', () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.NewCollaboration,
        options: {},
      };

      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.not.undefined;
      expect(result.id).to.equal(16);
    });
  });

  describe(`Unsupported subscription categories`, () => {
    test(`should return null for ${NotificationCategories.ThreadEdit} subscriptions`, () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.ThreadEdit,
        options: {},
      };

      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.undefined;
    });

    test(`should return null for ${NotificationCategories.CommentEdit} subscriptions`, () => {
      const findOptions: SubUniqueData = {
        categoryId: NotificationCategories.CommentEdit,
        options: {},
      };

      const result = findSubscription(findOptions, notifSubscriptions);
      expect(result).to.be.undefined;
    });
  });
});
