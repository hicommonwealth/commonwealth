import { eventHandler } from '@hicommonwealth/core';
import { ContestWorker } from '@hicommonwealth/model';

import { commonProtocol } from '@hicommonwealth/model';
import Sinon from 'sinon';
import Web3 from 'web3';

Sinon.stub(commonProtocol.contestHelper, 'addContent').resolves({
  txReceipt: 'abc',
  contentId: 'xyz',
});

Sinon.stub(commonProtocol.contestHelper, 'voteContent').resolves('abc');

Sinon.stub(commonProtocol.contestHelper, 'createWeb3Provider').resolves(
  new Web3(),
);

describe('Contest Worker Policy', () => {
  it('ThreadCreated event should invoke addContent protocol function', () => {
    eventHandler(
      ContestWorker(),
      {
        name: 'ThreadCreated',
        payload: {
          threadId: 1,
          userAddress: '0x0',
          chainNodeUrl: 'https://chain',
        },
      },
      true,
    );
  });

  it('ThreadUpvoted event should invoke voteContent protocol function', () => {
    eventHandler(ContestWorker(), {
      name: 'ThreadUpvoted',
      payload: {
        threadId: 1,
        userAddress: '0x0',
        chainNodeUrl: 'https://chain',
      },
    });
  });
});
