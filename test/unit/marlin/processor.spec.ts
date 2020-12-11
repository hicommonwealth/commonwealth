import chai from 'chai';
import { Processor } from '../../../src/marlin/processor';
import { Api, RawEvent, EventKind } from '../../../src/marlin/types';
const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });
const blockNumber = 10000;

const constructEvent = (data: object, section = '', typeDef: string[] = []): RawEvent => {
  return {
    args: data,
  } as RawEvent;
};

describe('Marlin Event Processor Tests', () => {
  it('should process a raw event into a CWEvent', async () => {
    const processor = new Processor({} as unknown as Api);
    const kind = EventKind.DelegateChanged;
    const fromDelegate = 'previousAddress';
    const toDelegate = 'toAddress';
    const delegator = 'fromAddress';
    const event = constructEvent({
      delegator,
      toDelegate,
      fromDelegate,
    });

    event.blockNumber = blockNumber;
    event.event = 'DelegateChanged';

    const result = await processor.process(event);
    assert.deepEqual(result, [{
      blockNumber,
      data: {
        kind,
        delegator,
        toDelegate,
        fromDelegate,
      },
      excludeAddresses: [ delegator, ]
    }]);
  });

  it('should gracefully fail to process an event with invalid type', async () => {
    const processor = new Processor({} as Api);
    const event = {
      event: 'NothingHappened',
      blockNumber,
      args: {
        proposalIndex: toHex(1),
      }
    } as unknown as RawEvent;
    const result = await processor.process(event);
    assert.isEmpty(result);
  });
});