import { EventContext } from '@hicommonwealth/core';
import { ContestWorker } from '@hicommonwealth/model';

describe('Contest Worker Policy', () => {
  it('ThreadCreated event should invoke addContent protocol function', () => {
    const context: EventContext<'ThreadCreated'> = {
      name: 'ThreadCreated',
      payload: {
        threadId: 1,
        userAddress: '0x0',
      },
    };
    ContestWorker().body.ThreadCreated(context);
  });

  it('ThreadUpvoted event should invoke voteContent protocol function', () => {
    const context: EventContext<'ThreadUpvoted'> = {
      name: 'ThreadUpvoted',
      payload: {
        threadId: 1,
        userAddress: '0x0',
      },
    };
    ContestWorker().body.ThreadUpvoted(context);
  });
});
