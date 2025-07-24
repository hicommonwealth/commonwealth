import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model/db';
import { ThreadAttributes } from '@hicommonwealth/model/models';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';
import { attributesOf } from '../../../server/util/sequelizeHelpers';
import { JoinCommunityArgs, ThreadArgs } from '../../util/modelUtils';

describe('User Dashboard API', () => {
  const chain = 'sushi';
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
  let baseUrl: string;

  beforeAll(async () => {
    server = await testServer();
    baseUrl = server.baseUrl;

    const topic = await models.Topic.findOne({
      where: { community_id: chain },
    });
    // @ts-expect-error StrictNullChecks
    topicId = topic.id;

    const topic2 = await models.Topic.create({
      name: 'Test Topic',
      description: 'A topic made for testing',
      community_id: chain2,
      featured_in_sidebar: false,
      featured_in_new_post: false,
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
    expect(userId).not.toBeNull();
    expect(userAddress).not.toBeNull();
    expect(userAddressId).not.toBeNull();
    expect(userJWT).not.toBeNull();
    expect(userDid).not.toBeNull();

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
    expect(userId2).not.toBeNull();
    expect(userAddress2).not.toBeNull();
    expect(userAddressId2).not.toBeNull();
    expect(userJWT2).not.toBeNull();
    expect(userDid2).not.toBeNull();

    // make second user join alex community
    const communityArgs: JoinCommunityArgs = {
      jwt: userJWT2,
      address: userAddress2,
      chain,
    };
    const res = await server.seeder.joinCommunity(communityArgs);
    expect(res).toBe(true);

    // sets user-2 to be admin of the alex community
    const isAdmin = await server.seeder.updateRole({
      address_id: userAddressId2,
      chainOrCommObj: { chain_id: chain2 },
      role: 'admin',
    });
    expect(isAdmin).not.toBeNull();

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
    expect(threadOne.status).toBe('Success');
    expect(threadOne.result).not.toBeNull();

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
    // // create a thread in both 'sushi' and 'alex' communities
    const threadTwo = await server.seeder.createThread(threadTwoArgs);
    expect(threadTwo.status).toBe('Success');
    expect(threadTwo.result).not.toBeNull();
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('/GetUserActivity', () => {
    const apiUrl = '/api/v1/GetUserActivity';

    test('should fail without JWT', async () => {
      const res = await fetch(`${baseUrl}${apiUrl}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          address: userAddress,
        },
      });
      expect(res).not.toBeNull();
      expect(res.status).not.toBe(200);
    });

    test('should return user activity for joined communities only', async () => {
      const url = new URL(`${baseUrl}${apiUrl}`);
      url.searchParams.set('chain', chain);
      url.searchParams.set('jwt', userJWT);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          address: userAddress,
        },
      });
      expect(res.status).toBe(200);
      const resText = await res.text();
      expect(resText).not.toBeNull();
      const resBody = JSON.parse(resText);
      const threadIds = resBody?.results?.map((a) => a.id);
      const chains = await models.Thread.findAll({
        attributes: attributesOf<ThreadAttributes>('community_id'),
        where: {
          id: {
            [Op.in]: threadIds,
          },
        },
        raw: true,
      });
      expect(chains).toEqual([{ community_id: chain }]);
    });

    test('should return user activity for newly joined communities', async () => {
      // make second user join alex community
      const communityArgs: JoinCommunityArgs = {
        jwt: userJWT,
        address: userAddress,
        chain: chain2,
      };
      const communityCreated = await server.seeder.joinCommunity(communityArgs);
      expect(communityCreated).toBe(true);

      const url = new URL(`${baseUrl}${apiUrl}`);
      url.searchParams.set('chain', chain);
      url.searchParams.set('jwt', userJWT);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          address: userAddress,
        },
      });
      expect(res.status).toBe(200);
      const resText = await res.text();
      expect(resText).not.toBeNull();
      const resBody = JSON.parse(resText);
      const threadIds = resBody?.results.map((a) => a.id);
      const chains = await models.Thread.findAll({
        attributes: attributesOf<ThreadAttributes>('community_id'),
        where: {
          id: {
            [Op.in]: threadIds,
          },
        },
        order: [['community_id', 'ASC']],
        raw: true,
      });
      expect(chains).toEqual([
        { community_id: chain2 },
        { community_id: chain },
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
        expect(res.status).toBe('Success');
        expect(res.result).not.toBeNull();
      }

      const url = new URL(`${baseUrl}${apiUrl}`);
      url.searchParams.set('chain', chain);
      url.searchParams.set('jwt', userJWT);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          address: userAddress,
        },
      });
      expect(res.status).toBe(200);
      const resText = await res.text();
      expect(resText).not.toBeNull();
      const resBody = JSON.parse(resText);
      const threadIds = resBody.results.map((a) => a.id);
      const chains = (
        await models.Thread.findAll({
          attributes: attributesOf<ThreadAttributes>('community_id'),
          where: {
            id: {
              [Op.in]: threadIds,
            },
          },
          raw: true,
        })
      ).map((x) => x.community_id);
      expect(chains.includes(threadOne.chainId)).toBe(false);
    });
  });

  describe.todo('/GetGlobalActivity', () => {});
});
