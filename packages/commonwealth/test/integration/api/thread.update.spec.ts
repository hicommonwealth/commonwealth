import type {
  Action,
  Awaitable,
  Message,
  Session,
  Signature,
} from '@canvas-js/interfaces';
import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);
const { expect } = chai;

describe('Thread Patch Update', () => {
  const chain = 'ethereum';

  let adminJWT: string;
  // the adminAddress with the chain and chain id prefix - this is used by canvas
  let adminCanvasAddress: string;
  let adminAddress: string;

  let userJWT: string;
  // the userAddress with the chain and chain id prefix - this is used by canvas
  let canvasAddress: string;
  let userAddress: string;
  let userSession: {
    session: Session;
    sign: (payload: Message<Action | Session>) => Awaitable<Signature>;
  };
  let topicId: number;

  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();

    const adminRes = await server.seeder.createAndVerifyAddress(
      { chain },
      'Alice',
    );
    {
      adminCanvasAddress = adminRes.address;
      adminAddress = adminCanvasAddress.split(':')[2];
      adminJWT = jwt.sign(
        { id: adminRes.user_id, email: adminRes.email },
        config.AUTH.JWT_SECRET,
      );
      const isAdmin = await server.seeder.updateRole({
        address_id: +adminRes.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
      expect(adminAddress).to.not.be.null;
      expect(adminJWT).to.not.be.null;
      expect(isAdmin).to.not.be.null;
    }

    const userRes = await server.seeder.createAndVerifyAddress(
      { chain },
      'Alice',
    );
    {
      canvasAddress = userRes.address;
      userAddress = canvasAddress.split(':')[2];
      userJWT = jwt.sign(
        { id: userRes.user_id, email: userRes.email },
        config.AUTH.JWT_SECRET,
      );
      userSession = { session: userRes.session, sign: userRes.sign };
      expect(userAddress).to.not.be.null;
      expect(userJWT).to.not.be.null;
    }

    const topic = await server.models.Topic.findOne({
      where: {
        community_id: chain,
        group_ids: [],
      },
    });
    // @ts-expect-error StrictNullChecks
    topicId = topic.id;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('update thread', () => {
    test('should update thread attributes as owner', async () => {
      const { result: thread } = await server.seeder.createThread({
        chainId: 'ethereum',
        address: canvasAddress,
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
        .agent(server.app)
        // @ts-expect-error StrictNullChecks
        .patch(`/api/threads/${thread.id}`)
        .set('Accept', 'application/json')
        .send({
          // @ts-expect-error StrictNullChecks
          author_chain: thread.community_id,
          // @ts-expect-error StrictNullChecks
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
        // @ts-expect-error StrictNullChecks
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

    test('should not allow non-admin to set pinned or spam', async () => {
      const { result: thread } = await server.seeder.createThread({
        chainId: 'ethereum',
        address: canvasAddress,
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
          .agent(server.app)
          // @ts-expect-error StrictNullChecks
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            // @ts-expect-error StrictNullChecks
            author_chain: thread.community_id,
            // @ts-expect-error StrictNullChecks
            chain: thread.community_id,
            address: userAddress,
            body: 'body1',
            jwt: userJWT,
            pinned: true,
            topicId,
          });
        expect(res.status).to.equal(400);
      }

      {
        const res = await chai.request
          .agent(server.app)
          // @ts-expect-error StrictNullChecks
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            // @ts-expect-error StrictNullChecks
            author_chain: thread.community_id,
            // @ts-expect-error StrictNullChecks
            chain: thread.community_id,
            address: userAddress,
            jwt: userJWT,
            spam: true,
            topicId,
          });
        expect(res.status).to.equal(400);
      }
    });

    test('should allow admin to set pinned or spam', async () => {
      // non-admin creates thread
      const { result: thread } = await server.seeder.createThread({
        chainId: 'ethereum',
        address: canvasAddress,
        jwt: userJWT,
        title: 'test2',
        body: 'body1',
        kind: 'discussion',
        stage: 'discussion',
        topicId,
        session: userSession.session,
        sign: userSession.sign,
      });

      // admin sets thread as pinned
      {
        const res = await chai.request
          .agent(server.app)
          // @ts-expect-error StrictNullChecks
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            // @ts-expect-error StrictNullChecks
            author_chain: thread.community_id,
            // @ts-expect-error StrictNullChecks
            chain: thread.community_id,
            address: adminAddress,
            jwt: adminJWT,
            body: 'body1',
            pinned: true,
            topicId,
          });
        expect(res.status).to.equal(200);
        expect(res.body.result.pinned).to.be.true;
      }

      // admin sets thread as spam
      {
        const res = await chai.request
          .agent(server.app)
          // @ts-expect-error StrictNullChecks
          .patch(`/api/threads/${thread.id}`)
          .set('Accept', 'application/json')
          .send({
            // @ts-expect-error StrictNullChecks
            author_chain: thread.community_id,
            // @ts-expect-error StrictNullChecks
            chain: thread.community_id,
            address: adminAddress,
            jwt: adminJWT,
            body: 'body1',
            spam: true,
            topicId,
          });
        expect(res.status).to.equal(200);
        expect(!!res.body.result.marked_as_spam_at).to.be.true;
      }
    });
  });
});
