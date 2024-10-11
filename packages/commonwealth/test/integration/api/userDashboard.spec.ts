import { dispose } from '@hicommonwealth/core';
import type { ThreadAttributes } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';
import { attributesOf } from '../../../server/util/sequelizeHelpers';
import { JoinCommunityArgs, ThreadArgs } from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('User Dashboard API', () => {
  const chain = 'ethereum';
  const chain2 = 'alex';
  // The createThread util uses the chainId parameter to determine
  // author_chain, which is required for authorship lookup.
  // Therefore, a valid chain MUST be included alongside
  // communityId, unlike in non-test thread creation
  const title = 'test title';
  const body = 'test body';
  const kind = 'discussion';

  let userJWT;
  let userId;
  let userAddress;
  let userAddressId;
  let userDid;

  let userJWT2;
  let userSession2;
  let userId2;
  let userAddress2;
  let userAddressId2;
  let userDid2;

  let threadOne;
  let topicId: number;
  let topicId2: number;
  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();

    const topic = await server.models.Topic.findOne({
      where: {
        community_id: chain,
        group_ids: [],
      },
    });
    // @ts-expect-error StrictNullChecks
    topicId = topic.id;

    const topic2 = await server.models.Topic.create({
      name: 'Test Topic',
      description: 'A topic made for testing',
      community_id: chain2,
      featured_in_sidebar: false,
      featured_in_new_post: false,
      group_ids: [],
    });
    // @ts-expect-error StrictNullChecks
    topicId2 = topic2.id;

    // creates 2 ethereum users
    const firstUser = await server.seeder.createAndVerifyAddress(
      { chain },
      'Alice',
    );
    userId = firstUser.user_id;
    userAddress = firstUser.address;
    userAddressId = firstUser.address_id;
    userDid = firstUser.did;
    userJWT = jwt.sign(
      { id: userId, email: firstUser.email },
      config.AUTH.JWT_SECRET,
    );
    expect(userId).to.not.be.null;
    expect(userAddress).to.not.be.null;
    expect(userAddressId).to.not.be.null;
    expect(userJWT).to.not.be.null;
    expect(userDid).to.not.be.null;

    const secondUser = await server.seeder.createAndVerifyAddress(
      { chain: chain2 },
      'Alice',
    );
    userId2 = secondUser.user_id;
    userAddress2 = secondUser.address;
    userAddressId2 = secondUser.address_id;
    userDid2 = secondUser.did;
    userJWT2 = jwt.sign(
      { id: userId2, email: secondUser.email },
      config.AUTH.JWT_SECRET,
    );
    userSession2 = { session: secondUser.session, sign: secondUser.sign };
    expect(userId2).to.not.be.null;
    expect(userAddress2).to.not.be.null;
    expect(userAddressId2).to.not.be.null;
    expect(userJWT2).to.not.be.null;
    expect(userDid2).to.not.be.null;

    // make second user join alex community
    const communityArgs: JoinCommunityArgs = {
      jwt: userJWT2,
      address: userAddress2,
      chain,
    };
    const res = await server.seeder.joinCommunity(communityArgs);
    expect(res).to.equal(true);

    // sets user-2 to be admin of the alex community
    const isAdmin = await server.seeder.updateRole({
      address_id: userAddressId2,
      chainOrCommObj: { chain_id: chain2 },
      role: 'admin',
    });
    expect(isAdmin).to.not.be.null;

    const threadOneArgs: ThreadArgs = {
      chainId: chain2,
      address: userAddress2,
      did: userDid2,
      jwt: userJWT2,
      title,
      body,
      readOnly: false,
      kind,
      session: userSession2.session,
      sign: userSession2.sign,
      topicId: topicId2,
    };
    threadOne = await server.seeder.createThread(threadOneArgs);
    expect(threadOne.status).to.equal('Success');
    expect(threadOne.result).to.not.be.null;

    const threadTwoArgs: ThreadArgs = {
      chainId: chain,
      address: userAddress2,
      did: userDid2,
      jwt: userJWT2,
      title,
      body,
      readOnly: false,
      kind,
      session: userSession2.session,
      sign: userSession2.sign,
      topicId,
    };
    //
    // // create a thread in both 'ethereum' and 'alex' communities
    const threadTwo = await server.seeder.createThread(threadTwoArgs);
    expect(threadTwo.status).to.equal('Success');
    expect(threadTwo.result).to.not.be.null;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('/GetUserActivity', () => {
    const queryArgs = { is_global: false };
    const apiUrl =
      '/api/internal/trpc/feed.getUserActivity?input=' +
      encodeURIComponent(JSON.stringify(queryArgs));

    test('should fail without JWT', async () => {
      const res = await chai.request
        .agent(server.app)
        .get(apiUrl)
        .set('Accept', 'application/json')
        .set('address', userAddress)
        .send({ chain });
      expect(res).to.not.be.null;
      expect(res.error).to.not.be.null;
    });

    test('should return user activity for joined communities only', async () => {
      const res = await chai.request
        .agent(server.app)
        .get(apiUrl)
        .set('Accept', 'application/json')
        .set('address', userAddress)
        .send({ chain, jwt: userJWT });

      expect(res.status).to.be.equal(200);
      expect(res.text).to.not.be.null;

      const resBody = JSON.parse(res.text);
      const threadIds = resBody.result.data.map((a) => a.id);
      const chains = await server.models.Thread.findAll({
        attributes: attributesOf<ThreadAttributes>('community_id'),
        where: {
          id: {
            [Op.in]: threadIds,
          },
        },
        raw: true,
      });
      expect(chains).to.deep.equal([{ community_id: 'ethereum' }]);
    });

    test('should return user activity for newly joined communities', async () => {
      // make second user join alex community
      const communityArgs: JoinCommunityArgs = {
        jwt: userJWT,
        address: userAddress,
        chain: chain2,
      };
      const communityCreated = await server.seeder.joinCommunity(communityArgs);
      expect(communityCreated).to.equal(true);

      const res = await chai.request
        .agent(server.app)
        .get(apiUrl)
        .set('Accept', 'application/json')
        .set('address', userAddress)
        .send({ chain, jwt: userJWT });

      expect(res.status).to.be.equal(200);
      expect(res.text).to.not.be.null;

      const resBody = JSON.parse(res.text);
      const threadIds = resBody.result.data.map((a) => a.id);
      const chains = await server.models.Thread.findAll({
        attributes: attributesOf<ThreadAttributes>('community_id'),
        where: {
          id: {
            [Op.in]: threadIds,
          },
        },
        order: [['community_id', 'ASC']],
        raw: true,
      });
      expect(chains).to.deep.equal([
        { community_id: 'alex' },
        { community_id: 'ethereum' },
      ]);
    });

    test('should return correctly ranked user activity', async () => {
      for (let i = 0; i < 48; i++) {
        const threadArgs: ThreadArgs = {
          chainId: chain,
          address: userAddress2,
          did: userDid2,
          jwt: userJWT2,
          title,
          body,
          readOnly: false,
          kind,
          session: userSession2.session,
          sign: userSession2.sign,
          topicId,
        };
        const res = await server.seeder.createThread(threadArgs);
        expect(res.status).to.equal('Success');
        expect(res.result).to.not.be.null;
      }

      const res = await chai.request
        .agent(server.app)
        .get(apiUrl)
        .set('Accept', 'application/json')
        .set('address', userAddress)
        .send({ chain, jwt: userJWT });

      expect(res.status).to.be.equal(200);
      expect(res.text).to.not.be.null;

      const resBody = JSON.parse(res.text);
      const threadIds = resBody.result.data.map((a) => a.id);
      const chains = (
        await server.models.Thread.findAll({
          attributes: attributesOf<ThreadAttributes>('community_id'),
          where: {
            id: {
              [Op.in]: threadIds,
            },
          },
          raw: true,
        })
      ).map((x) => x.community_id);
      expect(chains.includes(threadOne.chainId)).to.be.false;
    });
  });

  describe.todo('/GetGlobalActivity', () => {});
});
