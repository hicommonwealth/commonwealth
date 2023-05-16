import * as chai from 'chai';

import { Label, Types } from '../../../src/chain-bases/EVM/erc721';

const { assert } = chai;

describe('Erc721 labeler class tests', () => {
  it('should label a zero address approval event', async () => {
    const eventData: Types.IApproval = {
      kind: Types.EventKind.Approval,
      owner: 'owner',
      approved: '0x0000000000000000000000000000000000000000',
      tokenId: 'token id',
      contractAddress: 'contract address',
    };
    const labeledResult = Label(10, 'chain id', eventData);
    assert.equal(labeledResult.heading, 'Approval');
    assert.isString(labeledResult.label);
  });
});
