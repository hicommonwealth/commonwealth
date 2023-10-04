import chai from 'chai';
import { BigNumber } from 'ethers';

import { SupportedNetwork } from '../../../src';
import { Processor } from '../../../src/chains/compound/processor';
import type { Api, RawEvent } from '../../../src/chains/compound/types';
import { EventKind } from '../../../src/chains/compound/types';

const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });
const blockNumber = 10000;

const constructEvent = (data): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Compound Event Processor Tests', () => {
  it('should process a raw event into a CWEvent', async () => {
    const processor = new Processor({} as unknown as Api);
    const kind = EventKind.ProposalQueued;
    const id = BigNumber.from(5);
    const eta = 10;
    const event = constructEvent([id, eta]);

    event.blockNumber = blockNumber;
    event.name = 'ProposalQueued';

    const result = await processor.process(event);
    assert.deepEqual(result, [
      {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Compound,
        data: {
          kind,
          id: '0x05',
          eta,
        },
      },
    ]);
  });

  it('should gracefully fail to process an event with invalid type', async () => {
    const processor = new Processor({} as Api);
    const event = {
      event: 'NothingHappened',
      blockNumber,
      args: {
        proposalIndex: toHex(1),
      },
    } as unknown as RawEvent;
    const result = await processor.process(event);
    assert.isEmpty(result);
  });
});
