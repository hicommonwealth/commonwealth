import { Actor, dispose } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import * as tester from '@hicommonwealth/model/tester';
import {
  ChainBase,
  CommunityTierMap,
  UserTierMap,
} from '@hicommonwealth/shared';
import Chance from 'chance';
import jsonwebtoken from 'jsonwebtoken';
import moment from 'moment';
import fetch from 'node-fetch';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testServer, TestServer } from '../../../server-test';

const chance = Chance();

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
    const url = `${server.baseUrl}/api/v1/CreateThread`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        address: actor.address!,
      },
      body: JSON.stringify({
        jwt,
        community_id,
        topic_id,
        title: chance.name(),
        body: chance.name(),
        kind: 'discussion',
        stage: '',
        read_only: false,
      }),
    });
    return await res.text();
  };

  const CreateThreadReaction = async (
    actor: Actor,
    jwt: string,
    thread_id: number,
  ) => {
    const url = `${server.baseUrl}/api/v1/CreateThreadReaction`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        address: actor.address!,
      },
      body: JSON.stringify({
        jwt,
        thread_id,
        reaction: 'like',
      }),
    });
    return await res.text();
  };

  const CreateComment = async (
    actor: Actor,
    jwt: string,
    thread_id: number,
  ) => {
    const url = `${server.baseUrl}/api/v1/CreateComment`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        address: actor.address!,
      },
      body: JSON.stringify({
        jwt,
        thread_id,
        body: chance.name(),
      }),
    });
    return await res.text();
  };

  const CreateCommentReaction = async (
    actor: Actor,
    jwt: string,
    comment_id: number,
  ) => {
    const url = `${server.baseUrl}/api/v1/CreateCommentReaction`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        address: actor.address!,
      },
      body: JSON.stringify({
        jwt,
        comment_id,
        reaction: 'like',
      }),
    });
    return await res.text();
  };

  beforeAll(async () => {
    server = await testServer();

    const [member1_user] = await tester.seed('User', {
      profile: { name: 'Member 1' },
      tier: UserTierMap.NewlyVerifiedWallet,
      created_at: new Date(),
    });
    const [member2_user] = await tester.seed('User', {
      profile: { name: 'Member 2' },
      tier: UserTierMap.NewlyVerifiedWallet,
      created_at: moment().subtract(2, 'weeks'),
    });
    const [member3_user] = await tester.seed('User', {
      profile: { name: 'Member 3' },
      created_at: new Date(),
      tier: UserTierMap.SocialVerified,
    });
    const [community] = await tester.seed('Community', {
      chain_node_id: server.e2eTestEntities.testChainNodes[0].id,
      tier: CommunityTierMap.ManuallyVerified,
      base: ChainBase.Ethereum,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      allow_tokenized_threads: true,
      groups: [],
      topics: [{}],
      Addresses: [
        {
          role: 'member',
          user_id: member1_user!.id,
          verified: new Date(),
          address: '0x0000000000000000000000000000000000000111',
        },
        {
          role: 'member',
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
    const responseText = await CreateThread(member1, jwt1);
    expect(responseText).toEqual(
      '{"message":"Exceeded content creation limit","code":"UNAUTHORIZED"}',
    );
  });

  it('should throw after exceeding tier 2 creation limits', async () => {
    const responseText = await CreateThread(member2, jwt2);
    await CreateComment(member2, jwt2, JSON.parse(responseText).id);
    const response2Text = await CreateThread(member2, jwt2);
    expect(response2Text).toEqual(
      '{"message":"Exceeded content creation limit","code":"UNAUTHORIZED"}',
    );
  });

  it('should throw after exceeding tier 1 reaction limits', async () => {
    const responseText = await CreateThread(member3, jwt3);
    const thread_id = JSON.parse(responseText).id;
    const responses = await Promise.all(
      [1, 2, 3, 4, 5].map(() => CreateComment(member3, jwt3, thread_id)),
    );

    // have member 1 (tier 1) react on content
    await CreateThreadReaction(member1, jwt1, thread_id);
    for (let i = 0; i < 4; i++) {
      await CreateCommentReaction(member1, jwt1, JSON.parse(responses[i]).id);
    }

    const response2Text = await CreateCommentReaction(
      member1,
      jwt1,
      JSON.parse(responses[4]).id,
    );
    expect(response2Text).toEqual(
      '{"message":"Exceeded upvote limit","code":"UNAUTHORIZED"}',
    );
  });
});
