import { Actor, dispose } from '@hicommonwealth/core';
import { tester } from '@hicommonwealth/model';
import { ChainBase, UserTierMap } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import Chance from 'chance';
import jsonwebtoken from 'jsonwebtoken';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testServer, TestServer } from '../../../server-test';
import { config } from '../../../server/config';

const chance = Chance();
chai.use(chaiHttp);

describe('Tiered middleware', () => {
  let server: TestServer;
  let community_id: string;
  let topic_id: number;
  let member1: Actor;
  let member2: Actor;
  let member3: Actor;
  let jwt1: string = '';
  let jwt2: string = '';
  let jwt3: string = '';

  const CreateThread = async (actor: Actor, jwt: string) => {
    return await chai
      .request(server.app)
      .post(`/api/v1/CreateThread`)
      .set('address', actor.address!)
      .send({
        jwt,
        community_id,
        topic_id,
        title: chance.name(),
        body: chance.name(),
        kind: 'discussion',
        stage: '',
        read_only: false,
      });
  };

  const CreateThreadReaction = async (
    actor: Actor,
    jwt: string,
    thread_id: number,
  ) => {
    return await chai
      .request(server.app)
      .post(`/api/v1/CreateThreadReaction`)
      .set('address', actor.address!)
      .send({
        jwt,
        thread_id,
        reaction: 'like',
      });
  };

  const CreateComment = async (
    actor: Actor,
    jwt: string,
    thread_id: number,
  ) => {
    return await chai
      .request(server.app)
      .post(`/api/v1/CreateComment`)
      .set('address', actor.address!)
      .send({
        jwt,
        thread_id,
        body: chance.name(),
      });
  };

  const CreateCommentReaction = async (
    actor: Actor,
    jwt: string,
    comment_id: number,
  ) => {
    return await chai
      .request(server.app)
      .post(`/api/v1/CreateCommentReaction`)
      .set('address', actor.address!)
      .send({
        jwt,
        comment_id,
        reaction: 'like',
      });
  };

  beforeAll(async () => {
    server = await testServer();

    const [member1_user] = await tester.seed('User', {
      tier: UserTierMap.IncompleteUser,
      created_at: new Date(),
    });
    const [member2_user] = await tester.seed('User', {
      tier: UserTierMap.IncompleteUser,
      created_at: moment().subtract(2, 'weeks'),
    });
    const [member3_user] = await tester.seed('User', {
      created_at: new Date(),
      tier: UserTierMap.SocialVerified,
    });
    const [community] = await tester.seed('Community', {
      chain_node_id: server.e2eTestEntities.testChainNodes[0].id,
      base: ChainBase.Ethereum,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      allow_tokenized_threads: true,
      groups: [],
      topics: [{}],
      Addresses: [
        {
          role: 'admin',
          user_id: member1_user!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000111',
        },
        {
          role: 'admin',
          user_id: member2_user!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000222',
        },
        {
          role: 'admin',
          user_id: member3_user!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000333',
        },
      ],
    });
    member1 = {
      user: {
        id: member1_user!.id!,
        email: member1_user!.email!,
      },
      address: community?.Addresses?.at(0)?.address,
    };
    member2 = {
      user: {
        id: member2_user!.id!,
        email: member2_user!.email!,
      },
      address: community?.Addresses?.at(1)?.address,
    };
    member3 = {
      user: {
        id: member3_user!.id!,
        email: member3_user!.email!,
      },
      address: community?.Addresses?.at(2)?.address,
    };
    community_id = community!.id!;
    topic_id = community!.topics!.at(0)!.id!;
    jwt1 = jsonwebtoken.sign(
      {
        id: member1_user!.id!,
        email: member1_user!.email!,
      },
      config.AUTH.JWT_SECRET,
    );
    jwt2 = jsonwebtoken.sign(
      {
        id: member2_user!.id!,
        email: member2_user!.email!,
      },
      config.AUTH.JWT_SECRET,
    );
    jwt3 = jsonwebtoken.sign(
      {
        id: member3_user!.id!,
        email: member3_user!.email!,
      },
      config.AUTH.JWT_SECRET,
    );
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should throw after exceeding tier 1 creation limits', async () => {
    await CreateThread(member1, jwt1);
    const response = await CreateThread(member1, jwt1);
    expect(response.text).to.equal(
      '{"message":"Exceeded content creation limit","code":"UNAUTHORIZED"}',
    );
  });

  it('should throw after exceeding tier 2 creation limits', async () => {
    const response = await CreateThread(member2, jwt2);
    await CreateComment(member2, jwt2, response.body.id);
    const response2 = await CreateThread(member2, jwt2);
    expect(response2.text).to.equal(
      '{"message":"Exceeded content creation limit","code":"UNAUTHORIZED"}',
    );
  });

  it('should throw after exceeding tier 1 reaction limits', async () => {
    const response = await CreateThread(member3, jwt3);
    const thread_id = response.body.id;
    const responses = await Promise.all(
      [1, 2, 3, 4, 5].map(() => CreateComment(member3, jwt3, thread_id)),
    );

    // have member 1 (tier 1) react on content
    await CreateThreadReaction(member1, jwt1, thread_id);
    for (let i = 0; i < 4; i++) {
      await CreateCommentReaction(member1, jwt1, responses[i].body.id);
    }

    const response2 = await CreateCommentReaction(
      member1,
      jwt1,
      responses[4].body.id,
    );
    expect(response2.text).to.equal(
      '{"message":"Exceeded upvote limit","code":"UNAUTHORIZED"}',
    );
  });
});
