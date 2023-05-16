import chai from 'chai';

import { SupportedNetwork } from '../../../src';
import { Processor } from 'chain-events/src/chain-bases/EVM/aave/processor';
import type {
  Api,
  RawEvent,
} from 'chain-events/src/chain-bases/EVM/aave/types';
import { EventKind } from 'chain-events/src/chain-bases/EVM/aave/types';

const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });
const blockNumber = 10000;

const constructEvent = (data): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Aave Event Processor Tests', () => {
  it('should process a raw event into a CWEvent', async () => {
    const processor = new Processor({} as unknown as Api);
    const kind = EventKind.ProposalQueued;
    const id = 5;
    const executionTime = 10;
    const event = constructEvent({ id, executionTime });

    event.blockNumber = blockNumber;
    event.event = 'ProposalQueued';

    const result = await processor.process(event);
    assert.deepEqual(result, [
      {
        blockNumber,
        excludeAddresses: [],
        network: SupportedNetwork.Aave,
        data: {
          kind,
          id,
          executionTime,
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
