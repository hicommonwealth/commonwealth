import {
  Actor,
  InvalidActor,
  InvalidState,
  command,
  dispose,
  query,
} from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { _validateCommunityStakeConfig } from '../../__mocks__/services/commonProtocol';
import { GetCommunityStake, SetCommunityStake } from '../../src/community';
import { seedDb } from '../../src/test';

chai.use(chaiAsPromised);

describe('Community stake', () => {
  const id = 'common-protocol';
  const actor: Actor = {
    user: { id: 2, email: '' },
    address_id: '0xtestAddress',
  };
  const payload = {
    stake_id: 1,
    stake_token: '',
    vote_weight: 1,
    stake_enabled: true,
  };

  before(async () => {
    await seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('should fail set when community namespace not configured', () => {
    _validateCommunityStakeConfig.onFirstCall().rejects();
    expect(command(SetCommunityStake, id, payload, actor)).to.eventually.be
      .rejected;
  });

  it('should set and get community stake', async () => {
    const community = {
      community_id: id,
      Chain: { namespace: 'IanSpace' },
    };
    const ChainNode = {
      eth_chain_id: 11155111,
      url: 'https://ethereum-sepolia.publicnode.com',
    };

    const cr = await command(SetCommunityStake, id, payload, actor);
    expect(cr).to.deep.contains({
      ...community.Chain,
      ChainNode,
      CommunityStakes: [
        {
          community_id: id,
          ...payload,
          created_at: cr?.CommunityStakes?.at(0)?.created_at,
          updated_at: cr?.CommunityStakes?.at(0)?.updated_at,
        },
      ],
    });

    const qr = await query(GetCommunityStake, { community_id: id }, actor);
    expect(qr).to.deep.include({ ...payload, ...community });
  });

  it('should fail set when community not found', async () => {
    expect(
      command(SetCommunityStake, 'does-not-exist', payload, actor),
    ).to.eventually.be.rejectedWith(InvalidActor);
  });

  it('should fail set when community stake has been configured', () => {
    expect(
      command(SetCommunityStake, 'ethereum', payload, {
        user: { id: 2, email: '' },
        address_id: '0x42D6716549A78c05FD8EF1f999D52751Bbf9F46a',
      }),
    ).to.eventually.be.rejectedWith(
      InvalidState,
      'Stake 1 already configured in community ethereum',
    );
  });

  it('should get empty result when community stake not configured', async () => {
    const qr = await query(
      GetCommunityStake,
      { community_id: 'edgeware' },
      actor,
    );
    expect(qr).to.be.undefined;
  });
});
