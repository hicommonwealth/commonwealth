/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import { NotificationCategories } from 'common-common/src/types';
import jwt from 'jsonwebtoken';
import type NotificationSubscription from '../../../client/scripts/models/NotificationSubscription';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import { Errors as MarkNotifErrors } from '../../../server/routes/markNotificationsRead';
import Errors from '../../../server/routes/subscription/errors';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

// TODO: @Timothee Update all of these tests
describe.only('Subscriptions Tests', () => {
  let jwtToken;
  let loggedInAddr;
  let loggedInAddrId;
  const chain = 'ethereum';

  before('reset database', async () => {
    await resetDatabase();
    // get logged in address/user with JWT
    const result = await modelUtils.createAndVerifyAddress({ chain });
    loggedInAddr = result.address;
    loggedInAddrId = result.address_id;
    jwtToken = jwt.sign(
      { id: result.user_id, email: result.email },
      JWT_SECRET
    );
  });

  describe.only('/createSubscription test', () => {
    describe(`${NotificationCategories.NewThread} subscription tests`, () => {
      it('should create new-thread subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewThread;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, chain_id: chain, is_active });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.chain_id).to.equal(chain);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.null;
      });

      it('should fail to create a new-thread subscription if an invalid chain is given', async () => {
        const is_active = true;
        const category = NotificationCategories.NewThread;
        let res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidChain);

        res = await chai
          .request(app)
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
        expect(res.body.error).to.be.equal(Errors.InvalidChain);
      });

      it('should not create a duplicate new-thread subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewThread;
        let res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, chain_id: 'edgeware', is_active });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        const subscription = res.body.result;

        res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, chain_id: 'edgeware', is_active });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');

        expect(res.body.result.id).to.be.equal(subscription.id);
      });
    });

    describe(`${NotificationCategories.NewComment} subscription tests`, () => {
      let thread, comment, rootCommmentSubscription, commentSubscription;
      before('create thread', async () => {
        let res = await modelUtils.createThread({
          chainId: chain,
          address: loggedInAddr,
          jwt: jwtToken,
          title: 't',
          body: 't',
          kind: 'discussion',
          stage: 'discussion',
          topicName: 't',
          topicId: undefined,
        });
        expect(res).to.not.be.null;
        expect(res.status).to.be.equal('Success');
        thread = res.result;

        res = await modelUtils.createComment({
          chain,
          address: loggedInAddr,
          jwt: jwtToken,
          text: 'cw4eva',
          thread_id: thread.id,
        });
        expect(res).to.not.be.null;
        expect(res.status).to.be.equal('Success');
        comment = res.result;
      });

      it('should create new-comment subscription on a thread', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, thread_id: thread.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.equal(thread.id);
        expect(res.body.result.chain_id).to.be.equal(chain);
        expect(res.body.result.comment_id).to.be.null;
        rootCommmentSubscription = res.body.result;
      });

      it('should create new-comment subscription on a comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, comment_id: comment.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.null;
        expect(res.body.result.chain_id).to.be.equal(chain);
        expect(res.body.result.comment_id).to.be.equal(comment.id);
        commentSubscription = res.body.result;
      });

      it('should not create a duplicate new-comment subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        let res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, thread_id: thread.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(rootCommmentSubscription.id);

        res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, comment_id: comment.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(commentSubscription.id);
      });

      it('should fail to create a new-comment subscription on a thread and comment simultaneously', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(app)
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
          .request(app)
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
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, thread_id: 999999 });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find thread model for new subscription'
        );
      });

      it('should fail to create a new-comment subscription on a non-existent comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewComment;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, comment_id: 999999 });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find comment model for new subscription'
        );
      });
    });

    describe(`${NotificationCategories.NewReaction} subscription tests`, () => {
      let thread, comment, rootCommmentSubscription, commentSubscription;
      before('create thread and comment', async () => {
        let res = await modelUtils.createThread({
          chainId: chain,
          address: loggedInAddr,
          jwt: jwtToken,
          title: 't',
          body: 't',
          kind: 'discussion',
          stage: 'discussion',
          topicName: 't',
          topicId: undefined,
        });
        expect(res).to.not.be.null;
        expect(res.status).to.be.equal('Success');
        thread = res.result;

        res = await modelUtils.createComment({
          chain,
          address: loggedInAddr,
          jwt: jwtToken,
          text: 'cw4eva',
          thread_id: thread.id,
        });
        expect(res).to.not.be.null;
        expect(res.status).to.be.equal('Success');
        comment = res.result;
      });

      it('should create a new-reaction subscription on a thread', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, thread_id: thread.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.equal(thread.id);
        expect(res.body.result.chain_id).to.be.equal(chain);
        expect(res.body.result.comment_id).to.be.null;
        rootCommmentSubscription = res.body.result;
      });

      it('should create new-reaction subscription on a comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, comment_id: comment.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.thread_id).to.be.null;
        expect(res.body.result.chain_id).to.be.equal(chain);
        expect(res.body.result.comment_id).to.be.equal(comment.id);
        commentSubscription = res.body.result;
      });

      it('should not create a duplicate new-reaction subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        let res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, thread_id: thread.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(rootCommmentSubscription.id);

        res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, comment_id: comment.id });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.id).to.be.equal(commentSubscription.id);
      });

      it('should fail to create a new-reaction subscription on a thread and comment simultaneously', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(app)
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
          .request(app)
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
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, thread_id: 999999 });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find thread model for new subscription'
        );
      });

      it('should fail to create a new-reaction subscription on a non-existent comment', async () => {
        const is_active = true;
        const category = NotificationCategories.NewReaction;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, comment_id: 999999 });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(
          'Cannot find comment model for new subscription'
        );
      });
    });

    describe(`${NotificationCategories.NewMention} subscription tests`, () => {
      it('should fail to create a new-mention subscription using this route', async () => {
        const is_active = true;
        const category = NotificationCategories.NewMention;
        const res = await chai
          .request(app)
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
          .request(app)
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
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, chain_id: chain });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.chain_id).to.equal(chain);
        expect(res.body.result.is_active).to.be.equal(true);
        chainSubscription = res.body.result;
      });

      it('should not create a duplicate chain-event subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.ChainEvent;
        const res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active, chain_id: chain });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.category_id).to.be.equal(category);
        expect(res.body.result.chain_id).to.equal(chain);
        expect(res.body.result.is_active).to.be.equal(true);
        expect(res.body.result.id).to.equal(chainSubscription.id);
      });

      it('should fail to create a chain-event subscription with an invalid chain', async () => {
        const is_active = true;
        const category = NotificationCategories.ChainEvent;
        let res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidChain);

        res = await chai
          .request(app)
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
        expect(res.body.error).to.be.equal(Errors.InvalidChain);
      });
    });

    describe(`${NotificationCategories.SnapshotProposal} subscription tests`, () => {
      const snapshot_id = 'test_space';
      let snapshotSubscription;

      before('create a snapshot space', async () => {
        await models.SnapshotSpace.create({
          snapshot_space: snapshot_id,
        });
      });

      it('should create a snapshot-proposal subscription', async () => {
        const is_active = true;
        const category = NotificationCategories.SnapshotProposal;
        const snapshot_id = 'test_space';
        const res = await chai
          .request(app)
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
        const snapshot_id = 'test_space';
        const res = await chai
          .request(app)
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
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidSnapshotSpace);

        res = await chai
          .request(app)
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
          .request(app)
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
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidSubscriptionCategory);

        category = NotificationCategories.ThreadEdit;
        res = await chai
          .request(app)
          .post('/api/createSubscription')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, category, is_active });
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.be.equal(Errors.InvalidSubscriptionCategory);
      });
    });
  });

  describe('/viewSubscriptions', () => {
    it.skip('should check /viewSubscriptions for all', async () => {
      const subscription = await modelUtils.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      const res = await chai
        .request(app)
        .get('/api/viewSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });
  });

  describe('/disableSubscriptions + /enableSubscriptions', () => {
    let subscription: NotificationSubscription;
    beforeEach('creating a subscription', async () => {
      subscription = await modelUtils.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
    });

    it('should pause a subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('should unpause a subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should pause and unpause a subscription with just the id as string (not array)', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      res = await chai
        .request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should pause and unpause an array of subscription', async () => {
      const subscriptions = [];
      for (let i = 0; i < 3; i++) {
        subscriptions.push(
          modelUtils.createSubscription({
            jwt: jwtToken,
            is_active: true,
            category: NotificationCategories.NewThread,
          })
        );
      }
      const subscriptionIds = (await Promise.all(subscriptions)).map(
        (s) => s.id
      );
      let res = await chai
        .request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptionIds });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');

      res = await chai
        .request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptionIds });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable subscriptions not owned by the requester', async () => {
      expect(subscription).to.not.be.null;
      const result = await modelUtils.createAndVerifyAddress({ chain });
      const newJWT = jwt.sign(
        { id: result.user_id, email: result.email },
        JWT_SECRET
      );
      let res = await chai
        .request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: newJWT, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
      res = await chai
        .request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: newJWT, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
    });

    it('should fail to enable and disable subscription when no subscriptions are passed to route', async () => {
      let res = await chai
        .request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
      res = await chai
        .request(app)
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
    beforeEach('creating a subscription', async () => {
      subscription = await modelUtils.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
    });

    it('should turn on immediate emails, /enableImmediateEmails', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('should turn off immediate emails, /disableImmediateEmails', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable immediate emails when not passed ids', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
      res = await chai
        .request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });

    it('should successfully enable and disable with just a string id', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      res = await chai
        .request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          'subscription_ids[]': subscription.id.toString(),
        });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable immediate emails when requester does not own the subscription', async () => {
      const result = await modelUtils.createAndVerifyAddress({ chain });
      const newJwt = jwt.sign(
        { id: result.user_id, email: result.email },
        JWT_SECRET
      );
      expect(subscription).to.not.be.null;
      let res = await chai
        .request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: newJwt, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
      res = await chai
        .request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: newJwt, 'subscription_ids[]': [subscription.id] });
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
    });
  });

  describe('/deleteSubscription', () => {
    let subscription;

    beforeEach('make subscription', async () => {
      subscription = await modelUtils.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
    });

    it('should delete an active subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, subscription_id: subscription.id });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to delete when no subscription id is passed', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });

    it('should fail to find a bad subscription id', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai
        .request(app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, subscription_id: 'hello' });
      expect(res.body.error).to.not.be.null;
    });
  });

  describe('Notification Routes', () => {
    let subscription;
    let thread;
    let notifications;

    it('emitting a notification', async () => {
      // Subscription for Default User in 'Staking'
      subscription = await modelUtils.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      // New User makes a thread in 'Staking', should emit notification to Default User
      const result = await modelUtils.createAndVerifyAddress({ chain });
      const newAddress = result.address;
      const newJWT = jwt.sign(
        { id: result.user_id, email: result.email },
        JWT_SECRET
      );
      thread = await modelUtils.createThread({
        chainId: chain,
        jwt: newJWT,
        address: newAddress,
        title: 'hi',
        body: 'hi you!',
        kind: 'discussion',
        stage: 'discussion',
        topicName: 't',
        topicId: undefined,
      });
      expect(subscription).to.not.be.null;
      expect(thread).to.not.be.null;
    });

    it('should emit a Snapshot Proposal notification to a subscribed user', async () => {
      subscription = await modelUtils.createSubscription({
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.SnapshotProposal,
      });

      const result = await modelUtils.createAndVerifyAddress({ chain });
      const newAddress = result.address;
      const newJWT = jwt.sign(
        { id: result.user_id, email: result.email },
        JWT_SECRET
      );
      thread = await modelUtils.createThread({
        chainId: chain,
        jwt: newJWT,
        address: newAddress,
        title: 'hi snapshot proposal',
        body: 'hi you snapshot proposal!',
        kind: 'snapshot proposal',
        stage: 'discussion',
        topicName: 't',
        topicId: undefined,
      });
      expect(subscription).to.not.be.null;
      expect(thread).to.not.be.null;
    });

    describe('/viewNotifications: return notifications to user', () => {
      it("should return all notifications with just a user's jwt", async () => {
        const res = await chai
          .request(app)
          .post('/api/viewDiscussionNotifications')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.subscriptions.length).to.be.greaterThan(0);
        notifications = res.body.result.subscriptions;
      });

      it('should return only unread notifications', async () => {
        const res = await chai
          .request(app)
          .post('/api/viewDiscussionNotifications')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, unread_only: true });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.subscriptions.length).to.be.greaterThan(0);
        notifications = res.body.result.subscriptions;
      });

      it('should return only notifications with active_only turned on', async () => {
        const res = await chai
          .request(app)
          .post('/api/viewDiscussionNotifications')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, active_only: true });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.subscriptions.length).to.be.greaterThan(0);
        notifications = res.body.result.subscriptions;
      });
    });

    describe('/viewNotification Snapshot Proposals', () => {
      it('should return all snapshot proposals', async () => {
        const res = await chai
          .request(app)
          .post('/api/viewSnapshotProposals')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.proposals.length).to.be.greaterThan(0);
        notifications = res.body.result.proposals;
      });

      describe('/markNotificationsRead', async () => {
        it('should pass when query formatted correctly', async () => {
          // Mark Notifications Read for Default User
          expect(notifications).to.not.be.null;
          const notification_ids = notifications.map((n) => {
            return n.id;
          });
          const res = await chai
            .request(app)
            .post('/api/markNotificationsRead')
            .set('Accept', 'application/json')
            .send({ jwt: jwtToken, 'notification_ids[]': notification_ids });
          expect(res.body).to.not.be.null;
          expect(res.body.status).to.be.equal('Success');
        });
        it('should pass when notification id is string', async () => {
          // Mark Notifications Read for Default User
          expect(notifications).to.not.be.null;
          const notification_ids = notifications.map((n) => {
            return n.id;
          });
          const res = await chai
            .request(app)
            .post('/api/markNotificationsRead')
            .set('Accept', 'application/json')
            .send({
              jwt: jwtToken,
              'notification_ids[]': notification_ids[0].toString(),
            });
          expect(res.body).to.not.be.null;
          expect(res.body.status).to.be.equal('Success');
        });
        it('should fail when no notifications are passed', async () => {
          const res = await chai
            .request(app)
            .post('/api/markNotificationsRead')
            .set('Accept', 'application/json')
            .send({ jwt: jwtToken });
          expect(res.body).to.not.be.null;
          expect(res.body.error).to.not.be.null;
          expect(res.body.error).to.be.equal(MarkNotifErrors.NoNotificationIds);
        });
      });

      describe('/clearReadNotifications', async () => {
        it('should pass when query formatted correctly', async () => {
          // Clear Read for Default User
          expect(notifications).to.not.be.null;
          const res = await chai
            .request(app)
            .post('/api/clearReadNotifications')
            .set('Accept', 'application/json')
            .send({ jwt: jwtToken });
          expect(res.body).to.not.be.null;
          expect(res.body.status).to.be.equal('Success');
        });
      });
    });
  });
});
