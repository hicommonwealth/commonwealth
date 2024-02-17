import {
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

describe('Stake lifecycle', () => {
  const context = {
    id: 'common-protocol',
    actor: {
      user: { id: 2, email: '' },
      address_id: '0xtestAddress',
    },
    payload: {
      stake_id: 1,
      stake_token: '',
      vote_weight: 1,
      stake_enabled: true,
    },
  };

  before(async () => {
    await seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('should fail set when community namespace not configured', () => {
    _validateCommunityStakeConfig.onFirstCall().rejects();
    expect(command(SetCommunityStake, context)).to.eventually.be.rejected;
  });

  it('should set and get community stake', async () => {
    const community = {
      community_id: context.id,
      Chain: { namespace: 'IanSpace' },
    };
    const ChainNode = {
      eth_chain_id: 11155111,
      url: 'https://ethereum-sepolia.publicnode.com',
    };

    const cr = await command(SetCommunityStake, context);
    expect(cr).to.deep.contains({
      ...community.Chain,
      ChainNode,
      CommunityStakes: [
        {
          community_id: context.id,
          ...context.payload,
          created_at: cr?.CommunityStakes?.at(0)?.created_at,
          updated_at: cr?.CommunityStakes?.at(0)?.updated_at,
        },
      ],
    });

    const qr = await query(GetCommunityStake, {
      actor: context.actor,
      payload: { community_id: context.id },
    });
    expect(qr).to.deep.include({ ...context.payload, ...community });
  });

  it('should fail set when community not found', async () => {
    expect(
      command(SetCommunityStake, { ...context, id: 'does-not-exist' }),
    ).to.eventually.be.rejectedWith(InvalidActor);
  });

  it('should fail set when community stake has been configured', () => {
    expect(
      command(SetCommunityStake, {
        ...context,
        actor: {
          user: { id: 2, email: '' },
          address_id: '0x42D6716549A78c05FD8EF1f999D52751Bbf9F46a',
        },
        id: 'ethereum',
      }),
    ).to.eventually.be.rejectedWith(
      InvalidState,
      'Stake 1 already configured in community ethereum',
    );
  });

  it('should get empty result when community stake not configured', async () => {
    const qr = await query(GetCommunityStake, {
      actor: context.actor,
      payload: { community_id: 'edgeware' },
    });
    expect(qr).to.be.undefined;
  });
});
