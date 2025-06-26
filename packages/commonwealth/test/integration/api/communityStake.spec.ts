import { command, dispose, query } from '@hicommonwealth/core';
import {
  commonProtocol,
  Community,
  models,
  type UserInstance,
} from '@hicommonwealth/model';
import { UserTierMap } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { buildUser } from '../../unit/unitHelpers';

const baseRequest = {
  community_id: 'common-protocol',
  stake_id: 2,
  stake_token: '',
  vote_weight: 1,
  stake_enabled: true,
};

const expectedCreateResp = {
  community_id: baseRequest.community_id,
  stake_id: baseRequest.stake_id,
  stake_token: baseRequest.stake_token,
  vote_weight: baseRequest.vote_weight,
  stake_enabled: baseRequest.stake_enabled,
};

describe('POST communityStakes Tests', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();
  });

  afterAll(async () => {
    await dispose()();
  });

  test('Should create and update community stake', async () => {
    buildUser({
      userAttributes: {
        email: '',
        id: 1,
        isAdmin: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      },
    }) as UserInstance;
    const actor = {
      address: server.e2eTestEntities.testAddresses[0].address,
      user: {
        id: server.e2eTestEntities.testAddresses[0].user_id!,
        email: '',
        isAdmin: true,
      },
    };

    const community = await command(Community.SetCommunityStake(), {
      actor,
      payload: baseRequest,
    });
    const createResponse = community!.CommunityStakes?.[0];

    expect(createResponse!.community_id).toBe(expectedCreateResp.community_id);
    expect(createResponse!.stake_id).toBe(expectedCreateResp.stake_id);
    expect(createResponse!.stake_token).toBe(expectedCreateResp.stake_token);
    expect(createResponse!.vote_weight).toBe(expectedCreateResp.vote_weight);
    expect(createResponse!.stake_enabled).toBe(
      expectedCreateResp.stake_enabled,
    );

    let error;
    try {
      // try to change vote weight
      await command(Community.SetCommunityStake(), {
        actor,
        payload: { ...baseRequest, vote_weight: 20 },
      });
    } catch (e) {
      error = e;
    }

    expect(error.message).toBe('Community stake already configured');

    const found = await query(Community.GetCommunityStake(), {
      actor,
      payload: {
        community_id: baseRequest.community_id,
        stake_id: baseRequest.stake_id,
      },
    });

    expect(found!.stake!.community_id).toBe(expectedCreateResp.community_id);
    expect(found!.stake!.stake_id).toBe(expectedCreateResp.stake_id);
    expect(found!.stake!.stake_token).toBe(expectedCreateResp.stake_token);
    expect(found!.stake!.vote_weight).toBe(expectedCreateResp.vote_weight);
    expect(found!.stake!.stake_enabled).toBe(expectedCreateResp.stake_enabled);
  });

  test('The integration with protocol works', async () => {
    const community = await models.Community.findOne({
      where: {
        id: 'common-protocol',
      },
    });
    expect(community).not.toBeNull();
    await commonProtocol.communityStakeConfigValidator.validateCommunityStakeConfig(
      community!,
      2,
    );
  });
});
