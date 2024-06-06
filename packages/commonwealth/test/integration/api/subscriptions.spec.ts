/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { dispose } from '@hicommonwealth/core';
import { SubscriptionValidationErrors } from '@hicommonwealth/model';
import { NotificationCategories } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import type NotificationSubscription from '../../../client/scripts/models/NotificationSubscription';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';
import Errors from '../../../server/routes/subscription/errors';

chai.use(chaiHttp);
const { expect } = chai;

describe('Subscriptions Tests', () => {
  let jwtToken, loggedInAddr, loggedInSession, thread, comment, userId: number;
  const community_id = 'ethereum';
  let server: TestServer;

  before('reset database', async () => {
    server = await testServer();
    // get logged in address/user with JWT
    const result = await server.seeder.createAndVerifyAddress(
      { chain: community_id },
      'Alice',
    );
    loggedInAddr = result.address;
    loggedInSession = { session: result.session, sign: result.sign };
    jwtToken = jwt.sign(
      { id: result.user_id, email: result.email },
      config.AUTH.JWT_SECRET,
    );
    userId = +result.user_id;

    const topic = await server.models.Topic.findOne({
      where: {
        community_id,
        group_ids: [],
      },
    });

    let res = await server.seeder.createThread({
      chainId: community_id,
      address: loggedInAddr,
      jwt: jwtToken,
      title: 't',
      body: 't',
      kind: 'discussion',
      stage: 'discussion',
      // @ts-expect-error StrictNullChecks
      topicId: topic.id,
      session: loggedInSession.session,
      sign: loggedInSession.sign,
    });
    expect(res).to.not.be.null;
    expect(res.status).to.be.equal('Success');
    thread = res.result;

    res = await server.seeder.createComment({
      chain: community_id,
      address: loggedInAddr,
      jwt: jwtToken,
      text: 'cw4eva',
      thread_id: thread.id,
      session: loggedInSession.session,
      sign: loggedInSession.sign,
    });
    expect(res).to.not.be.null;
    expect(res.status).to.be.equal('Success');
    comment = res.result;
  });

  after(async () => {
    await dispose()();
  });

  describe('/createSubscription test', () => {
    describe(`${NotificationCategories.NewThread} subscription tests`, () => {
      it('should create new-thread subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewThread;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, community_id, is_active });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.community_id).to.equal(community_id);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.null;
      });

      it('should fail to create a new-thread subscription if an invalid chain is given', async () => {
        const is_active = true;
        const category = NotificationCategories.NewThread;
        let res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidCommunity);

        res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            community_id: 'very_random_chain_name_yee_haw',
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidCommunity);
      });

      it('should not create a duplicate new-thread subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewThread;
        let res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            community_id: 'edgeware',
            is_active,
          });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        const subscription = res.body.result;

        res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            community_id: 'edgeware',
            is_active,
          });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');

        expect(res.body.result.id).to.be.equal(subscription.id);
      });
    });

    describe(`${NotificationCategories.NewComment} subscription tests`, () => {
      let rootCommmentSubscription, commentSubscription;

      it('should create new-comment subscription on a thread', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: thread.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.equal(thread.id);
        expect(res.body.result.community_id).to.be.equal(community_id);
        expect(res.body.result.comment_id).to.be.null;
        rootCommmentSubscription = res.body.result;
      });

      it('should create new-comment subscription on a comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            comment_id: comment.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.null;
        expect(res.body.result.community_id).to.be.equal(community_id);
        expect(res.body.result.comment_id).to.be.equal(comment.id);
        commentSubscription = res.body.result;
      });

      it('should not create a duplicate new-comment subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        let res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: thread.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(rootCommmentSubscription.id);

        res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            comment_id: comment.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(commentSubscription.id);
      });

      it('should fail to create a new-comment subscription on a thread and comment simultaneously', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: thread.id,
            comment_id: comment.id,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(Errors.BothThreadAndComment);
      });

      it('should fail to create a new-comment subscription without a thread or comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(Errors.NoThreadOrComment);
      });

      it('should fail to create a new-comment subscription on a non-existent thread', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: 999999,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find thread model for new subscription',
        );
      });

      it('should fail to create a new-comment subscription on a non-existent comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            comment_id: 999999,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find comment model for new subscription',
        );
      });
    });

    describe(`${NotificationCategories.NewReaction} subscription tests`, () => {
      let rootCommmentSubscription, commentSubscription;

      it('should create a new-reaction subscription on a thread', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: thread.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.equal(thread.id);
        expect(res.body.result.community_id).to.be.equal(community_id);
        expect(res.body.result.comment_id).to.be.null;
        rootCommmentSubscription = res.body.result;
      });

      it('should create new-reaction subscription on a comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            comment_id: comment.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.null;
        expect(res.body.result.community_id).to.be.equal(community_id);
        expect(res.body.result.comment_id).to.be.equal(comment.id);
        commentSubscription = res.body.result;
      });

      it('should not create a duplicate new-reaction subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        let res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: thread.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(rootCommmentSubscription.id);

        res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            comment_id: comment.id,
          });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(commentSubscription.id);
      });

      it('should fail to create a new-reaction subscription on a thread and comment simultaneously', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: thread.id,
            comment_id: comment.id,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(Errors.BothThreadAndComment);
      });

      it('should fail to create a new-reaction subscription without a thread or comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(Errors.NoThreadOrComment);
      });

      it('should fail to create a new-reaction subscription on a non-existent thread', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            thread_id: 999999,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find thread model for new subscription',
        );
      });

      it('should fail to create a new-reaction subscription on a non-existent comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            comment_id: 999999,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find comment model for new subscription',
        );
      });
    });

    describe(`${NotificationCategories.NewMention} subscription tests`, () => {
      it('should fail to create a new-mention subscription using this route', async () => {
        const is_active = true;
        const category = NotificationCategories.NewMention;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(Errors.NoMentions);
      });
    });

    describe(`${NotificationCategories.NewCollaboration} subscription tests`, () => {
      it('should fail to create a new-collaboration subscription using this route', async () => {
        const is_active = true;
        const category = NotificationCategories.NewCollaboration;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(Errors.NoCollaborations);
      });
    });

    describe(`${NotificationCategories.ChainEvent} subscription tests`, () => {
      let chainSubscription;

      it('should create a chain-event subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.ChainEvent;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, community_id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.community_id).to.equal(community_id);
        expect(res.body.result.is_active).to.be.equal(true);
        chainSubscription = res.body.result;
      });

      it('should not create a duplicate chain-event subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.ChainEvent;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, community_id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.community_id).to.equal(community_id);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.id).to.equal(chainSubscription.id);
      });

      it('should fail to create a chain-event subscription with an invalid chain', async () => {
        const is_active = true;
        const category = NotificationCategories.ChainEvent;
        let res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidCommunity);

        res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            chain_id: 'very_random_chain_name_yee_haw',
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidCommunity);
      });
    });

    describe(`${NotificationCategories.SnapshotProposal} subscription tests`, () => {
      const snapshot_id = 'dydxgov.eth';
      let snapshotSubscription;

      it('should create a snapshot-proposal subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.SnapshotProposal;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, snapshot_id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.snapshot_id).to.be.equal(snapshot_id);
        snapshotSubscription = res.body.result;
      });

      it('should not create a duplicate snapshot-proposal subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.SnapshotProposal;
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, snapshot_id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.id).to.equal(snapshotSubscription.id);
      });

      it('should fail to create a chain-event subscription with an invalid snapshot_id', async () => {
        const is_active = true;
        const category = NotificationCategories.SnapshotProposal;
        let res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidSnapshotSpace);

        res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({
            jwt: jwtToken,
            category,
            is_active,
            snapshot_id: 'very_random_snapshot_space_yee_haw',
          });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidSnapshotSpace);
      });
    });

    describe('Misc category subscription tests', () => {
      it('should fail to create a subscription with an unknown category', async () => {
        const is_active = true;
        const category = 'unknown_category';
        const res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidNotificationCategory);
      });

      it('should fail to create a subscription with an invalid category', async () => {
        const is_active = true;
        let category = NotificationCategories.ThreadEdit;
        let res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidSubscriptionCategory);

        category = NotificationCategories.ThreadEdit;
        res = await chai
          .request(server.app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidSubscriptionCategory);
      });
    });
  });

  describe('/viewSubscriptions', () => {
    let threadSub, chainEventSub;
    before('Delete existing subscriptions and create new ones', async () => {
      await server.models.Subscription.destroy({
        where: {},
      });

      threadSub = await server.seeder.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
        community_id: community_id,
      });
      chainEventSub = await server.seeder.createSubscription({
        jwt: jwtToken,
        is_active: false,
        category: NotificationCategories.ChainEvent,
        community_id: community_id,
      });
    });

    it('should retrieve all of a users subscriptions', async () => {
      const res = await chai
        .request(server.app)
        .get('/api/viewSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.be.an('array');
      expect(res.body.result.length).to.be.equal(2);

      const threadSubRes = res.body.result.find(
        (sub: NotificationSubscription) => sub.id === threadSub.id,
      );
      const ceSubRes = res.body.result.find(
        (sub: NotificationSubscription) => sub.id === chainEventSub.id,
      );
      expect(threadSubRes).to.not.be.undefined;
      expect(ceSubRes).to.not.be.undefined;

      expect(threadSub.id).to.be.equal(threadSub.id);
      expect(ceSubRes.id).to.be.equal(chainEventSub.id);
    });

    it('should not fetch subscriptions of another user', async () => {
      const result = await server.seeder.createAndVerifyAddress(
        { chain: community_id },
        'Alice',
      );
      const newJWT = jwt.sign(
        { id: result.user_id, email: result.email },
        config.AUTH.JWT_SECRET,
      );

      await server.seeder.createSubscription({
        jwt: newJWT,
        is_active: true,
        category: NotificationCategories.NewThread,
        community_id,
      });

      const res = await chai
        .request(server.app)
        .get('/api/viewSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.be.an('array');
      expect(res.body.result.length).to.be.equal(2);

      const threadSubRes = res.body.result.find(
        (sub: NotificationSubscription) => sub.id === threadSub.id,
      );
      const ceSubRes = res.body.result.find(
        (sub: NotificationSubscription) => sub.id === chainEventSub.id,
      );
      expect(threadSubRes).to.not.be.undefined;
      expect(ceSubRes).to.not.be.undefined;

      expect(threadSub.id).to.be.equal(threadSub.id);
      expect(ceSubRes.id).to.be.equal(chainEventSub.id);
    });
  });

  describe('/disableSubscriptions + /enableSubscriptions', () => {
    let subscription: NotificationSubscription;
    before('creating a subscription', async () => {
      subscription = await server.seeder.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
        community_id,
      });
    });

    it('should disable a subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(server.app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('should enable a subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(server.app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should disable and enable a subscription with just the id as string (not array)', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(server.app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          // @ts-expect-error StrictNullChecks
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      res = await chai
        .request(server.app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          // @ts-expect-error StrictNullChecks
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should pause and unpause an array of subscription', async () => {
      const subscriptions = [];
      for (const category of [
        NotificationCategories.NewThread,
        NotificationCategories.ChainEvent,
      ]) {
        subscriptions.push(
          // @ts-expect-error StrictNullChecks
          server.seeder.createSubscription({
            jwt: jwtToken,
            is_active: true,
            category: category,
            community_id,
          }),
        );
      }
      const subscriptionIds = (await Promise.all(subscriptions)).map(
        // @ts-expect-error StrictNullChecks
        (s) => s.id,
      );
      let res = await chai
        .request(server.app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptionIds });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');

      res = await chai
        .request(server.app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptionIds });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable subscriptions not owned by the requester', async () => {
      expect(subscription).to.not.be.null;
      const result = await server.seeder.createAndVerifyAddress(
        { chain: community_id },
        'Alice',
      );
      const newJWT = jwt.sign(
        { id: result.user_id, email: result.email },
        config.AUTH.JWT_SECRET,
      );
      let res = await chai
        .request(server.app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: newJWT, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
      res = await chai
        .request(server.app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: newJWT, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
    });

    it('should fail to enable and disable subscription when no subscriptions are passed to route', async () => {
      let res = await chai
        .request(server.app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
      res = await chai
        .request(server.app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });
  });

  describe('/enableImmediateEmails and /disableImmediateEmails', () => {
    let subscription: NotificationSubscription;
    before('creating a subscription', async () => {
      subscription = await server.seeder.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
        community_id,
      });
    });

    it('should turn on immediate emails, /enableImmediateEmails', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(server.app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('should turn off immediate emails, /disableImmediateEmails', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(server.app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable immediate emails when not passed ids', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(server.app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
      res = await chai
        .request(server.app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });

    it('should successfully enable and disable with just a string id', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(server.app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          // @ts-expect-error StrictNullChecks
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      res = await chai
        .request(server.app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          // @ts-expect-error StrictNullChecks
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable immediate emails when requester does not own the subscription', async () => {
      const result = await server.seeder.createAndVerifyAddress(
        { chain: community_id },
        'Alice',
      );
      const newJwt = jwt.sign(
        { id: result.user_id, email: result.email },
        config.AUTH.JWT_SECRET,
      );
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(server.app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: newJwt, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
      res = await chai
        .request(server.app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: newJwt, 'subscription_ids[]': [subscription.id] });
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
    });
  });

  describe('/deleteSubscription', () => {
    let subscription;

    before('make subscription', async () => {
      subscription = await server.seeder.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
        community_id,
      });
    });

    it('should delete an active subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(server.app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, subscription_id: subscription.id });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to delete when no subscription id is passed', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(server.app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });

    it('should fail to find an invalid subscription id', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(server.app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, subscription_id: -999999 });
      expect(res.body.error).to.not.be.null;
    });
  });

  describe('Subscription model validation', () => {
    const sequelizeErrMsg = 'Validation error: ';
    const subscriptionCreateErrMsg = 'Subscription creation should fail';
    it('should fail to create a subscription with an invalid category', async () => {
      let category_id = 'invalid';
      try {
        await server.models.Subscription.create({
          subscriber_id: userId,
          category_id,
        });
        expect.fail(subscriptionCreateErrMsg);
      } catch (e) {
        expect(e.message).to.be.equal(
          `${sequelizeErrMsg}${SubscriptionValidationErrors.UnsupportedCategory}`,
        );
      }

      category_id = NotificationCategories.ThreadEdit;
      try {
        await server.models.Subscription.create({
          subscriber_id: userId,
          category_id,
        });
        expect.fail(subscriptionCreateErrMsg);
      } catch (e) {
        expect(e.message).to.be.equal(
          `${sequelizeErrMsg}${SubscriptionValidationErrors.UnsupportedCategory}`,
        );
      }

      category_id = NotificationCategories.CommentEdit;
      try {
        await server.models.Subscription.create({
          subscriber_id: userId,
          category_id,
        });
        expect.fail(subscriptionCreateErrMsg);
      } catch (e) {
        expect(e.message).to.be.equal(
          `${sequelizeErrMsg}${SubscriptionValidationErrors.UnsupportedCategory}`,
        );
      }
    });

    it(`should fail to create a ${NotificationCategories.NewThread} subscription without a chain_id`, async () => {
      const category_id = NotificationCategories.NewThread;
      try {
        await server.models.Subscription.create({
          subscriber_id: userId,
          category_id,
        });
        expect.fail(subscriptionCreateErrMsg);
      } catch (e) {
        expect(e.message).to.be.equal(
          `${sequelizeErrMsg}${SubscriptionValidationErrors.NoCommunityId}`,
        );
      }
    });

    it(`should fail to create a ${NotificationCategories.ChainEvent} subscription without a chain_id`, async () => {
      const category_id = NotificationCategories.ChainEvent;
      try {
        await server.models.Subscription.create({
          subscriber_id: userId,
          category_id,
        });
        expect.fail(subscriptionCreateErrMsg);
      } catch (e) {
        expect(e.message).to.be.equal(
          `${sequelizeErrMsg}${SubscriptionValidationErrors.NoCommunityId}`,
        );
      }
    });

    describe(`${NotificationCategories.NewComment} tests`, () => {
      it(`should fail to create a subscription without a chain_id`, async () => {
        const category_id = NotificationCategories.NewComment;
        try {
          await server.models.Subscription.create({
            subscriber_id: userId,
            category_id,
          });
          expect.fail(subscriptionCreateErrMsg);
        } catch (e) {
          expect(e.message).to.be.equal(
            `${sequelizeErrMsg}${SubscriptionValidationErrors.NoCommunityId}`,
          );
        }
      });

      it(`should fail to create a subscription with both a thread_id and a comment_id`, async () => {
        const category_id = NotificationCategories.NewComment;
        try {
          await server.models.Subscription.create({
            subscriber_id: userId,
            category_id,
            community_id,
            thread_id: 1,
            comment_id: 1,
          });
          expect.fail(subscriptionCreateErrMsg);
        } catch (e) {
          expect(e.message).to.be.equal(
            `${sequelizeErrMsg}${SubscriptionValidationErrors.NotBothThreadAndComment}`,
          );
        }
      });

      it(`should fail to create a subscription without a thread_id and a comment_id`, async () => {
        const category_id = NotificationCategories.NewComment;
        try {
          await server.models.Subscription.create({
            subscriber_id: userId,
            category_id,
            community_id,
          });
          expect.fail(subscriptionCreateErrMsg);
        } catch (e) {
          expect(e.message).to.be.equal(
            `${sequelizeErrMsg}${SubscriptionValidationErrors.NoThreadOrComment}`,
          );
        }
      });
    });

    describe(`${NotificationCategories.NewReaction} tests`, () => {
      it(`should fail to create a subscription without a chain_id`, async () => {
        const category_id = NotificationCategories.NewReaction;
        try {
          await server.models.Subscription.create({
            subscriber_id: userId,
            category_id,
          });
          expect.fail(subscriptionCreateErrMsg);
        } catch (e) {
          expect(e.message).to.be.equal(
            `${sequelizeErrMsg}${SubscriptionValidationErrors.NoCommunityId}`,
          );
        }
      });

      it(`should fail to create a subscription with both a thread_id and a comment_id`, async () => {
        const category_id = NotificationCategories.NewReaction;
        try {
          await server.models.Subscription.create({
            subscriber_id: userId,
            category_id,
            community_id,
            thread_id: 1,
            comment_id: 1,
          });
          expect.fail(subscriptionCreateErrMsg);
        } catch (e) {
          expect(e.message).to.be.equal(
            `${sequelizeErrMsg}${SubscriptionValidationErrors.NotBothThreadAndComment}`,
          );
        }
      });

      it(`should fail to create a subscription without a thread_id and a comment_id`, async () => {
        const category_id = NotificationCategories.NewReaction;
        try {
          await server.models.Subscription.create({
            subscriber_id: userId,
            category_id,
            community_id,
          });
          expect.fail(subscriptionCreateErrMsg);
        } catch (e) {
          expect(e.message).to.be.equal(
            `${sequelizeErrMsg}${SubscriptionValidationErrors.NoThreadOrComment}`,
          );
        }
      });
    });

    it(`should allow ${NotificationCategories.NewMention} to be created`, async () => {
      const category_id = NotificationCategories.NewMention;
      try {
        const result = await server.models.Subscription.create({
          subscriber_id: userId,
          category_id,
        });
        expect(result).to.not.be.null;
      } catch (e) {
        expect.fail('Subscription creation should not fail');
      }
    });

    it(`should allow ${NotificationCategories.NewCollaboration} to be created`, async () => {
      const category_id = NotificationCategories.NewCollaboration;
      try {
        const result = await server.models.Subscription.create({
          subscriber_id: userId,
          category_id,
        });
        expect(result).to.not.be.null;
      } catch (e) {
        expect.fail('Subscription creation should not fail');
      }
    });
  });
});
