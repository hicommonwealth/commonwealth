import { eventHandler } from '@hicommonwealth/core';
import { ContestWorker } from '@hicommonwealth/model';

import { commonProtocol } from '@hicommonwealth/model';
import Sinon from 'sinon';

Sinon.stub(commonProtocol.contestHelper, 'addContent').resolves({
  txReceipt: 'abc',
  contentId: 'xyz',
});

Sinon.stub(commonProtocol.contestHelper, 'voteContent').resolves('abc');

describe('Contest Worker Policy', () => {
  it('ThreadCreated event should invoke addContent protocol function', () => {
    eventHandler(
      ContestWorker(),
      {
        name: 'ThreadCreated',
        payload: {
          threadId: 1,
          userAddress: '0x0',
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
      },
    });
  });
});
