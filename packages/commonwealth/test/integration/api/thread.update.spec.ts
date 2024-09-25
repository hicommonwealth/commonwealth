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
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);
const { expect } = chai;

async function update(
  app: Express,
  address: string,
  payload: Record<string, unknown>,
) {
  return chai.request
    .agent(app)
    .post(`/api/v1/UpdateThread`)
    .set('Accept', 'application/json')
    .set('address', address)
    .send(payload);
}

describe('Thread Patch Update', () => {
  const chain = 'ethereum';

  let adminJWT: string;
  let adminAddress: string;

  let userJWT: string;
  let userDid: `did:${string}`;
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
      adminAddress = adminRes.address;
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
      userAddress = userRes.address;
      userDid = userRes.did;
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
        address: userAddress,
        did: userDid,
        jwt: userJWT,
        title: 'test1',
        body: 'body1',
        kind: 'discussion',
        stage: 'discussion',
        topicId,
        session: userSession.session,
        sign: userSession.sign,
      });

      const res = await update(server.app, userAddress, {
        thread_id: thread!.id,
        author_chain: thread!.community_id,
        chain: thread!.community_id,
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
      expect(res.body).to.contain({
        id: thread!.id,
        community_id: 'ethereum',
        title: 'newTitle',
        body: 'newBody',
        stage: 'voting',
      });
      // expect(res.body.result.topic.name).to.equal('newTopic');
      expect(res.body.locked).to.not.be.null;
      expect(res.body.archived).to.not.be.null;
    });

    test('should not allow non-admin to set pinned or spam', async () => {
      const { result: thread } = await server.seeder.createThread({
        chainId: 'ethereum',
        address: userAddress,
        did: userDid,
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
        const res = await update(server.app, userAddress, {
          thread_id: thread!.id,
          author_chain: thread!.community_id,
          chain: thread!.community_id,
          address: userAddress,
          body: 'body1',
          jwt: userJWT,
          pinned: true,
          topicId,
        });
        expect(res.status).to.equal(401);
      }

      {
        const res = await update(server.app, userAddress, {
          thread_id: thread!.id,
          author_chain: thread!.community_id,
          chain: thread!.community_id,
          address: userAddress,
          jwt: userJWT,
          spam: true,
          topicId,
        });
        expect(res.status).to.equal(401);
      }
    });

    test('should allow admin to set pinned or spam', async () => {
      // non-admin creates thread
      const { result: thread } = await server.seeder.createThread({
        chainId: 'ethereum',
        address: userAddress,
        did: userDid,
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
        const res = await update(server.app, adminAddress, {
          thread_id: thread!.id,
          author_chain: thread!.community_id,
          chain: thread!.community_id,
          address: adminAddress,
          jwt: adminJWT,
          body: 'body1',
          pinned: true,
          topicId,
        });
        expect(res.status).to.equal(200);
        expect(res.body.pinned).to.be.true;
      }

      // admin sets thread as spam
      {
        const res = await update(server.app, adminAddress, {
          thread_id: thread!.id,
          author_chain: thread!.community_id,
          chain: thread!.community_id,
          address: adminAddress,
          jwt: adminJWT,
          body: 'body1',
          spam: true,
          topicId,
        });
        expect(res.status).to.equal(200);
        expect(!!res.body.marked_as_spam_at).to.be.true;
      }
    });
  });
});
