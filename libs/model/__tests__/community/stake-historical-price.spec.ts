import { Actor, dispose, query } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import { GetStakeHistoricalPrice } from '../../src/community/GetStakeHistoricalPrice.query';
import { seed } from '../../src/test';

chai.use(chaiAsPromised);
const chance = Chance();

describe('Stake Historical Price', () => {
  let id;
  let actor: Actor;

  let payload;

  before(async () => {
    const [communityStakes] = await seed('StakeTransaction', {
      timestamp: 1000,
      Communities: [{}],
      CommunityStakes: [{}],
    });

    payload = { community_id: communityStakes.community_id };
  });

  after(async () => {
    await dispose()();
  });

  it('should return undefined if no historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      payload: { past_date_epoch: 1, community_id: 'non-existing' },
    });
    expect(results?.old_price).to.equal(undefined);
  });

  it('should return the historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      payload: {
        past_date_epoch: (Date.now() - 24 * 60 * 60 * 1000) / 1000,
        community_id: 'non-existing',
      },
    });
    expect(results?.old_price).to.equal(undefined);
  });
});
