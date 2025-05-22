import { command, dispose, query } from '@hicommonwealth/core';
import {
  commonProtocol,
  Community,
  models,
  type UserInstance,
} from '@hicommonwealth/model';
import { UserTierMap } from '@hicommonwealth/shared';
import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { buildUser } from '../../unit/unitHelpers';

chai.use(chaiHttp);
chai.should();

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

    assert.equal(createResponse!.community_id, expectedCreateResp.community_id);
    assert.equal(createResponse!.stake_id, expectedCreateResp.stake_id);
    assert.equal(createResponse!.stake_token, expectedCreateResp.stake_token);
    assert.equal(createResponse!.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(
      createResponse!.stake_enabled,
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

    assert.equal(error.message, 'Community stake already configured');

    const found = await query(Community.GetCommunityStake(), {
      actor,
      payload: {
        community_id: baseRequest.community_id,
        stake_id: baseRequest.stake_id,
      },
    });

    assert.equal(found!.stake!.community_id, expectedCreateResp.community_id);
    assert.equal(found!.stake!.stake_id, expectedCreateResp.stake_id);
    assert.equal(found!.stake!.stake_token, expectedCreateResp.stake_token);
    assert.equal(found!.stake!.vote_weight, expectedCreateResp.vote_weight);
    assert.equal(found!.stake!.stake_enabled, expectedCreateResp.stake_enabled);
  });

  test('The integration with protocol works', async () => {
    const community = await models.Community.findOne({
      where: {
        id: 'common-protocol',
      },
    });
    assert.isNotNull(community);
    await commonProtocol.communityStakeConfigValidator.validateCommunityStakeConfig(
      community!,
      2,
    );
  });
});
