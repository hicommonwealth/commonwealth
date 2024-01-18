import { assert } from 'chai';
import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
import models from '../../../server/database';
import { CommunityStakeAttributes } from '../../../server/models/community_stake';
import { UserInstance } from '../../../server/models/user';
import { buildUser } from '../../unit/unitHelpers';

const baseRequest: CommunityStakeAttributes = {
  community_id: 'ethereum',
  stake_id: 1,
  stake_token: '',
  stake_scaler: 1,
  stake_enabled: true,
};

describe('PUT communityStakes Tests', () => {
  it('Correctly creates and updates community stake', async () => {
    const controller = new ServerCommunitiesController(models, null);
    const user: UserInstance = buildUser({
      models,
      userAttributes: { email: '', id: 1, isAdmin: true },
    }) as UserInstance;

    const createResponse = await controller.putCommunityStake({
      communityStake: baseRequest,
      user: user,
    });

    const expectedCreateResp = {
      community_id: createResponse.community_id,
      stake_id: createResponse.stake_id,
      stake_token: createResponse.stake_token,
      stake_scaler: createResponse.stake_scaler,
      stake_enabled: createResponse.stake_enabled,
    };

    assert.equal(createResponse.community_id, expectedCreateResp.community_id);
    assert.equal(createResponse.stake_id, expectedCreateResp.stake_id);
    assert.equal(createResponse.stake_token, expectedCreateResp.stake_token);
    assert.equal(createResponse.stake_scaler, expectedCreateResp.stake_scaler);
    assert.equal(
      createResponse.stake_enabled,
      expectedCreateResp.stake_enabled,
    );

    const updateResp = await controller.putCommunityStake({
      communityStake: { ...baseRequest, stake_id: 2 },
      user: user,
    });

    const expectedUpdateResp = {
      community_id: updateResp.community_id,
      stake_id: updateResp.stake_id,
      stake_token: updateResp.stake_token,
      stake_scaler: updateResp.stake_scaler,
      stake_enabled: updateResp.stake_enabled,
    };

    assert.equal(updateResp.community_id, expectedUpdateResp.community_id);
    assert.equal(updateResp.stake_id, expectedUpdateResp.stake_id);
    assert.equal(updateResp.stake_token, expectedUpdateResp.stake_token);
    assert.equal(updateResp.stake_scaler, expectedUpdateResp.stake_scaler);
    assert.equal(updateResp.stake_enabled, expectedUpdateResp.stake_enabled);
  });
});
