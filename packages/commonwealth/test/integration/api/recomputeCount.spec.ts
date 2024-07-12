/* eslint-disable max-len */
import { dispose } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { recomputeCounts } from '../../../scripts/recompute-count-job';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);

const notif_feed_categories = ['new-thread-creation', 'new-comment-creation'];

let testVerifiedChainAddress;
const chain = 'alex';

describe('recomputeCounts', () => {
  let server: TestServer;
  let testJwtToken;

  async function calcAllCountsFromSourceTables() {
    const retCommentCounts = (await server.models.Comment.count({
      // @ts-expect-error StrictNullChecks
      where: {
        deleted_at: null,
      },
      group: ['thread_id'],
    })) as any;

    const commentCounts = {};
    for (const cc of retCommentCounts) {
      commentCounts[cc.thread_id] = cc.count;
    }

    const retThreadReactionCounts = (await server.models.Reaction.count({
      // @ts-expect-error StrictNullChecks
      where: {
        thread_id: {
          [Op.not]: null,
        },
      },
      group: ['thread_id'],
    })) as any;

    const threadReactionCounts = {};
    for (const trc of retThreadReactionCounts) {
      threadReactionCounts[trc.thread_id] = trc.count;
    }

    const retCommentReactionCounts = (await server.models.Reaction.count({
      // @ts-expect-error StrictNullChecks
      where: {
        comment_id: {
          [Op.not]: null,
        },
      },
      group: ['comment_id'],
    })) as any;

    const commentReactionCounts = {};
    for (const crc of retCommentReactionCounts) {
      commentReactionCounts[crc.comment_id] = crc.count;
    }

    const notifications = (await server.models.sequelize.query(
      `
        SELECT nt.thread_id, max(nt.id) as id
        FROM "Notifications" nt
        where nt.category_id IN (:categories)
        GROUP BY nt.thread_id
    `,
      {
        replacements: {
          categories: notif_feed_categories,
        },
        type: QueryTypes.SELECT,
      },
    )) as any;

    const notification_ids = {};
    for (const notification of notifications) {
      if (!notification.thread_id) continue;
      notification_ids[notification.thread_id] = notification.id;
    }

    return {
      commentCounts,
      threadReactionCounts,
      commentReactionCounts,
      notification_ids,
    };
  }

  async function getAllCountsFromPreComputedColumns() {
    const threads = await server.models.Thread.findAll();
    const commentCounts = {};
    const threadReactionCounts = {};
    const notification_ids = {};
    const commentReactionCounts = {};
    for (const thread of threads) {
      if (thread.comment_count) {
        // @ts-expect-error StrictNullChecks
        commentCounts[thread.id] = thread.comment_count;
      }

      if (thread.reaction_count) {
        // @ts-expect-error StrictNullChecks
        threadReactionCounts[thread.id] = thread.reaction_count;
      }

      if (thread.max_notif_id) {
        if (thread.id) {
          notification_ids[thread.id] = thread.max_notif_id;
        }
      }
    }

    const comments = await server.models.Comment.findAll();
    for (const comment of comments) {
      if (!comment.reaction_count) continue;
      // @ts-expect-error StrictNullChecks
      commentReactionCounts[comment.id] = comment.reaction_count;
    }

    return {
      commentCounts,
      threadReactionCounts,
      commentReactionCounts,
      notification_ids,
    };
  }

  async function calcCountsFromSourceTable(
    threadId: number,
    commentId: number,
  ) {
    const commentCount = await server.models.Comment.count({
      // @ts-expect-error StrictNullChecks
      where: {
        thread_id: threadId,
        deleted_at: null,
      },
    });

    const threadReactionCount = await server.models.Reaction.count({
      where: {
        thread_id: threadId,
      },
    });

    const commentReactionCount = await server.models.Reaction.count({
      where: {
        comment_id: commentId,
      },
    });

    // sort notification by id to get the latest notification for test thread limit 1
    const notifications = await server.models.Notification.findAll({
      where: {
        thread_id: threadId,
        category_id: {
          [Op.in]: notif_feed_categories,
        },
      },
      order: [['id', 'DESC']],
      limit: 1,
    });

    let notification_id = 0;
    if (notifications.length > 0) {
      notification_id = notifications[0].id;
    }

    return {
      commentCount,
      threadReactionCount,
      commentReactionCount,
      notification_id,
    };
  }

  async function getCountsFromPreComputedColumns(
    threadId: number,
    commentId: number,
  ) {
    const comment = await server.models.Comment.findOne({
      where: {
        id: commentId,
      },
    });

    const thread = await server.models.Thread.findOne({
      where: {
        id: threadId,
      },
    });

    return {
      // @ts-expect-error StrictNullChecks
      commentCount: thread.comment_count,
      // @ts-expect-error StrictNullChecks
      threadReactionCount: thread.reaction_count,
      // @ts-expect-error StrictNullChecks
      commentReactionCount: comment.reaction_count,
      // @ts-expect-error StrictNullChecks
      notification_id: thread.max_notif_id,
    };
  }

  async function getCounts(threadId: number, commentId: number) {
    const countsFromSourceTable = await calcCountsFromSourceTable(
      threadId,
      commentId,
    );
    const countsFromPreComputedColumns = await getCountsFromPreComputedColumns(
      threadId,
      commentId,
    );
    return {
      countsFromSourceTable,
      countsFromPreComputedColumns,
    };
  }

  async function getCountsAll() {
    const countsFromSourceTable = await calcAllCountsFromSourceTables();
    const countsFromPreComputedColumns =
      await getAllCountsFromPreComputedColumns();
    return {
      countsFromSourceTable,
      countsFromPreComputedColumns,
    };
  }

  async function createCommentRaw() {
    await server.models.sequelize.query(
      `
    INSERT INTO "Comments" ("id", "community_id", "address_id", "text", "thread_id", "plaintext", "created_at", "updated_at")
    VALUES
        (-300, '${chain}', '${testVerifiedChainAddress.user_id}', '', ${server.e2eTestEntities.testThreads[0].id}, '',now(),now()),
        (-400, '${chain}', '${testVerifiedChainAddress.user_id}', '', ${server.e2eTestEntities.testThreads[0].id}, '',now(),now()),
        (-500, '${chain}', '${testVerifiedChainAddress.user_id}', '', ${server.e2eTestEntities.testThreads[0].id}, '',now(),now())
    `,
    );
  }

  async function createThreadReactionRaw() {
    const canvas_hash =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    await server.models.sequelize.query(
      `
    INSERT INTO "Reactions" ("id", "community_id", "address_id", "reaction", "thread_id", "comment_id", "canvas_hash", "created_at", "updated_at")
    VALUES(-300, '${chain}', '${testVerifiedChainAddress.user_id}', 'like', ${server.e2eTestEntities.testThreads[0].id}, null, '${canvas_hash}', now(), now()),
    (-400, '${chain}', '${testVerifiedChainAddress.user_id}', 'like', ${server.e2eTestEntities.testThreads[0].id}, null, '${canvas_hash}', now(), now()),
    (-500, '${chain}', '${testVerifiedChainAddress.user_id}', 'like', ${server.e2eTestEntities.testThreads[0].id}, null, '${canvas_hash}', now(), now())
    `,
    );
  }

  async function createCommentReactionRaw() {
    const canvas_hash =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    await server.models.sequelize.query(
      `
    INSERT INTO "Reactions" ("id", "community_id", "address_id", "reaction", "thread_id", "comment_id", "canvas_hash", "created_at", "updated_at")
    VALUES(-3000, '${chain}', '${testVerifiedChainAddress.user_id}', 'like', null, ${server.e2eTestEntities.testComments[0].id}, '${canvas_hash}', now(), now())
    `,
    );
  }

  async function verifyRecomputeCountSingle() {
    const before = await getCounts(
      // @ts-expect-error StrictNullChecks
      server.e2eTestEntities.testThreads[0].id,
      server.e2eTestEntities.testComments[0].id,
    );
    expect(before.countsFromSourceTable).to.deep.equal(
      before.countsFromPreComputedColumns,
    );
    await recomputeCounts();
    const after = await getCounts(
      // @ts-expect-error StrictNullChecks
      server.e2eTestEntities.testThreads[0].id,
      server.e2eTestEntities.testComments[0].id,
    );
    expect(after.countsFromSourceTable).to.deep.equal(
      after.countsFromPreComputedColumns,
    );
    expect(before.countsFromSourceTable).to.deep.equal(
      after.countsFromSourceTable,
    );
    expect(before.countsFromPreComputedColumns).to.deep.equal(
      after.countsFromPreComputedColumns,
    );
  }

  async function verifyRecomputeCountAll() {
    const before = await getCountsAll();
    expect(before.countsFromSourceTable).to.deep.equal(
      before.countsFromPreComputedColumns,
    );
    await recomputeCounts();
    const after = await getCountsAll();
    expect(after.countsFromSourceTable).to.deep.equal(
      after.countsFromPreComputedColumns,
    );
    expect(before.countsFromSourceTable).to.deep.equal(
      after.countsFromSourceTable,
    );
    expect(before.countsFromPreComputedColumns).to.deep.equal(
      after.countsFromPreComputedColumns,
    );
  }

  beforeAll(async () => {
    server = await testServer();
    testVerifiedChainAddress = await server.seeder.createAndVerifyAddress(
      { chain },
      'Alice',
    );
    testJwtToken = jwt.sign(
      {
        id: testVerifiedChainAddress.user_id,
        email: null,
      },
      config.AUTH.JWT_SECRET,
    );
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('counts ', () => {
    test('recompute counts, check single thread-comment', async () => {
      await verifyRecomputeCountSingle();
    });

    test('recompute counts,for all thread-comment', async () => {
      await verifyRecomputeCountAll();
    });
  });

  describe('comment count should be correct on recompute count', () => {
    test('add comment using raw query, count corrected by recompute count', async () => {
      let before = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(before.countsFromSourceTable).to.deep.equal(
        before.countsFromPreComputedColumns,
      );
      await createCommentRaw();
      before = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(before.countsFromSourceTable).to.not.deep.equal(
        before.countsFromPreComputedColumns,
      );
      expect(before.countsFromSourceTable.commentCount).to.not.deep.equal(
        before.countsFromPreComputedColumns.commentCount,
      );
      await recomputeCounts();
      const after = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(after.countsFromSourceTable).to.deep.equal(
        after.countsFromPreComputedColumns,
      );
      await verifyRecomputeCountAll();
    });
  });

  describe('reaction count should be correct on recompute count', () => {
    test('add reaction to thread using raw query, count corrected by recompute count', async () => {
      let before = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(before.countsFromSourceTable).to.deep.equal(
        before.countsFromPreComputedColumns,
      );
      await createThreadReactionRaw();
      before = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(before.countsFromSourceTable).to.not.deep.equal(
        before.countsFromPreComputedColumns,
      );
      expect(
        before.countsFromSourceTable.threadReactionCount,
      ).to.not.deep.equal(
        before.countsFromPreComputedColumns.threadReactionCount,
      );
      await recomputeCounts();
      const after = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(after.countsFromSourceTable).to.deep.equal(
        after.countsFromPreComputedColumns,
      );
      await verifyRecomputeCountAll();
    });

    test('add reaction to comment using raw query, count corrected by recompute count', async () => {
      let before = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(before.countsFromSourceTable).to.deep.equal(
        before.countsFromPreComputedColumns,
      );
      await createCommentReactionRaw();
      before = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(before.countsFromSourceTable).to.not.deep.equal(
        before.countsFromPreComputedColumns,
      );
      expect(
        before.countsFromSourceTable.commentReactionCount,
      ).to.not.deep.equal(
        before.countsFromPreComputedColumns.commentReactionCount,
      );
      await recomputeCounts();
      const after = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(after.countsFromSourceTable).to.deep.equal(
        after.countsFromPreComputedColumns,
      );
      await verifyRecomputeCountAll();
    });
  });

  describe('notification should be correct on recompute count', () => {
    test('add comment from api, notification id is incremented', async () => {
      const before = await getCounts(
        // @ts-expect-error <StrictNullChecks>
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );

      const cRes = await server.seeder.createComment({
        chain,
        address: testVerifiedChainAddress.address,
        jwt: testJwtToken,
        text: 'test comment',
        thread_id: server.e2eTestEntities.testThreads[0].id,
        session: testVerifiedChainAddress.session,
        sign: testVerifiedChainAddress.sign,
      });

      expect(cRes).not.to.be.null;
      expect(cRes.error).not.to.be.null;

      const after = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(after.countsFromSourceTable.notification_id).to.be.eq(
        before.countsFromSourceTable.notification_id + 1,
      );
      await verifyRecomputeCountAll();
    });

    test('add reaction to thread from api, notification id is unchanged', async () => {
      const before = await getCounts(
        // @ts-expect-error <StrictNullChecks>
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );

      const cRes = await server.seeder.createThreadReaction({
        chain,
        address: testVerifiedChainAddress.address,
        jwt: testJwtToken,
        reaction: 'like',
        // @ts-expect-error StrictNullChecks
        thread_id: server.e2eTestEntities.testThreads[0].id,
        author_chain: chain,
        session: testVerifiedChainAddress.session,
        sign: testVerifiedChainAddress.sign,
      });

      expect(cRes).not.to.be.null;
      expect(cRes.error).not.to.be.null;

      const after = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(after.countsFromSourceTable.notification_id).to.be.eq(
        before.countsFromSourceTable.notification_id,
      );
      await verifyRecomputeCountAll();
    });

    test('add reaction to comment from api, notification id is unchanged', async () => {
      const before = await getCounts(
        // @ts-expect-error <StrictNullChecks>
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );

      const cRes = await server.seeder.createReaction({
        chain,
        address: testVerifiedChainAddress.address,
        jwt: testJwtToken,
        reaction: 'like',
        comment_id: server.e2eTestEntities.testComments[0].id,
        author_chain: chain,
        session: testVerifiedChainAddress.session,
        sign: testVerifiedChainAddress.sign,
      });

      expect(cRes).not.to.be.null;
      expect(cRes.error).not.to.be.null;

      const after = await getCounts(
        // @ts-expect-error StrictNullChecks
        server.e2eTestEntities.testThreads[0].id,
        server.e2eTestEntities.testComments[0].id,
      );
      expect(after.countsFromSourceTable.notification_id).to.be.eq(
        before.countsFromSourceTable.notification_id,
      );
      await verifyRecomputeCountAll();
    });
  });
});
