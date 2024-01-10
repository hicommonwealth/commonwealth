/* eslint-disable @typescript-eslint/no-unused-vars */
import chai from 'chai';
import chaiHttp from 'chai-http';

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from 'server/config';
import * as modelUtils from 'test/util/modelUtils';
import app, { resetDatabase } from '../../../server-test';

chai.use(chaiHttp);
const { expect } = chai;

describe('Thread Patch Update', () => {
  const chain = 'ethereum';

  let adminJWT;
  let adminAddress;

  let userJWT;
  let userAddress;
  let userSession;

  let topicId;

  before(async () => {
    await resetDatabase();
    topicId = await modelUtils.getTopicId({ chain });
    const adminRes = await modelUtils.createAndVerifyAddress({ chain });
    {
      adminAddress = adminRes.address;
      adminJWT = jwt.sign(
        { id: adminRes.user_id, email: adminRes.email },
        JWT_SECRET,
      );
      const isAdmin = await modelUtils.updateRole({
        address_id: adminRes.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
      expect(adminAddress).to.not.be.null;
      expect(adminJWT).to.not.be.null;
      expect(isAdmin).to.not.be.null;
    }

    const userRes = await modelUtils.createAndVerifyAddress({ chain });
    {
      userAddress = userRes.address;
      userJWT = jwt.sign(
        { id: userRes.user_id, email: userRes.email },
        JWT_SECRET,
      );
      userSession = { session: userRes.session, sign: userRes.sign };
      expect(userAddress).to.not.be.null;
      expect(userJWT).to.not.be.null;
    }
  });

  describe('update thread', () => {
    it('should update thread attributes as owner', async () => {
      const { result: thread } = await modelUtils.createThread({
        chainId: 'ethereum',
        address: userAddress,
        jwt: userJWT,
        title: 'test1',
        body: 'body1',
        kind: 'discussion',
        stage: 'discussion',
        topicId,
        session: userSession.session,
        sign: userSession.sign,
      });

      const res = await chai.request
        .agent(app)
        .patch(`/api/threads/${thread.id}`)
        .set('Accept', 'application/json')
        .send({
          author_chain: thread.community_id,
          chain: thread.community_id,
          address: userAddress,
          topicId,
          jwt: userJWT,
          title: 'newTitle',
          body: 'newBody',
          stage: 'voting',
          locked: true,
          archived: true,
        });

      expect(res.status).to.equal(200);
      expect(res.body.result).to.contain({
        id: thread.id,
        community_id: 'ethereum',
        title: 'newTitle',
        body: 'newBody',
        stage: 'voting',
      });
      // expect(res.body.result.topic.name).to.equal('newTopic');
      expect(res.body.result.locked).to.not.be.null;
      expect(res.body.result.archived).to.not.be.null;
    });

    it('should not allow non-admin to set pinned or spam', async () => {
      const { result: thread } = await modelUtils.createThread({
        chainId: 'ethereum',
        address: userAddress,
        jwt: userJWT,
        title: 'test2',
        body: 'body2',
        kind: 'discussion',
        stage: 'discussion',
        topicId,
        session: userSession.session,
        sign: userSession.sign,
      });

      {
        const res = await chai.request
          .agent(app)
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            author_chain: thread.community_id,
            chain: thread.community_id,
            address: userAddress,
            jwt: userJWT,
            pinned: true,
            topicId,
          });
        expect(res.status).to.equal(400);
      }

      {
        const res = await chai.request
          .agent(app)
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            author_chain: thread.community_id,
            chain: thread.community_id,
            address: userAddress,
            jwt: userJWT,
            spam: true,
            topicId,
          });
        expect(res.status).to.equal(400);
      }
    });

    it('should allow admin to set pinned or spam', async () => {
      // non-admin creates thread
      const { result: thread } = await modelUtils.createThread({
        chainId: 'ethereum',
        address: userAddress,
        jwt: userJWT,
        title: 'test2',
        body: 'body2',
        kind: 'discussion',
        stage: 'discussion',
        topicId,
        session: userSession.session,
        sign: userSession.sign,
      });

      // admin sets thread as pinned
      {
        const res = await chai.request
          .agent(app)
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            author_chain: thread.community_id,
            chain: thread.community_id,
            address: adminAddress,
            jwt: adminJWT,
            pinned: true,
            topicId,
          });
        expect(res.status).to.equal(200);
        expect(res.body.result.pinned).to.be.true;
      }

      // admin sets thread as spam
      {
        const res = await chai.request
          .agent(app)
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            author_chain: thread.community_id,
            chain: thread.community_id,
            address: adminAddress,
            jwt: adminJWT,
            spam: true,
            topicId,
          });
        expect(res.status).to.equal(200);
        expect(!!res.body.result.marked_as_spam_at).to.be.true;
      }
    });
  });
});
