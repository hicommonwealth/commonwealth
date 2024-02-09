import {
  Actor,
  BalanceType,
  InvalidState,
  // InvalidState,
  command,
  dispose,
} from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { CreateNode } from '../../../model/src/node';
import { seedDb } from '../../src/test';

chai.use(chaiAsPromised);

describe('Node', () => {
  const actor: Actor = {
    user: { id: 2, email: '' },
    address_id: '0xtestAddress',
  };
  const payload = {
    url: 'https://example.com',
    name: 'example node',
    balance_type: BalanceType.Ethereum,
  };

  before(async () => {
    await seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('should set and get node', async () => {
    // const node = {
    //   id,
    //   Chain: { namespace: 'IanSpace' },
    // };
    // const ChainNode = {
    //   eth_chain_id: 11155111,
    //   url: 'https://ethereum-sepolia.publicnode.com',
    // };

    const cr = await command(CreateNode, payload.url, payload, actor);
    expect(cr).to.deep.contains(payload);

    // const qr = await query(GetCommunityStake, { community_id: id }, actor);
    // expect(qr).to.deep.include({ ...payload, ...node });
  });

  it('should fail set when node url is found', async () => {
    command(CreateNode, 'exampleUrl', payload, actor),
      expect(
        command(CreateNode, 'exampleUrl', payload, actor),
      ).to.eventually.be.rejectedWith(InvalidState);
  });
});
