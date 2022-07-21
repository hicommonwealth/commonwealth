import chai from 'chai';

import { SupportedNetwork } from '../../../src';
import { Processor } from '../../../src/chains/moloch/processor';
import { Api, RawEvent, EventKind } from '../../../src/chains/moloch/types';

const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

describe('Moloch Event Processor Tests', () => {
  it('should process a raw event into a CWEvent', async () => {
    const processor = new Processor(
      ({
        proposalQueue: async () => ({
          startingPeriod: '1',
          details: 'hello',
          yesVotes: '10',
          noVotes: '5',
        }),
      } as unknown) as Api,
      1
    );
    const event = ({
      event: 'ProcessProposal',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
        memberAddress: 'member',
        applicant: 'applicant',
        tokenTribute: toHex(5),
        sharesRequested: toHex(6),
        didPass: true,
        yesVotes: toHex(10),
        noVotes: toHex(5),
      },
    } as unknown) as RawEvent;
    const result = await processor.process(event);
    assert.deepEqual(result, [
      {
        blockNumber: 10,
        network: SupportedNetwork.Moloch,
        data: {
          kind: EventKind.ProcessProposal,
          proposalIndex: 1,
          member: 'member',
          applicant: 'applicant',
          tokenTribute: '5',
          sharesRequested: '6',
          didPass: true,
          yesVotes: '10',
          noVotes: '5',
        },
      },
    ]);
  });

  it('should gracefully fail to process an event with invalid type', async () => {
    const processor = new Processor({} as Api, 1);
    const event = ({
      event: 'NothingHappened',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
      },
    } as unknown) as RawEvent;
    const result = await processor.process(event);
    assert.isEmpty(result);
  });

  it('should gracefully fail to process an event with invalid data', async () => {
    const processor = new Processor({} as Api, 1);
    const event = ({
      event: 'SubmitProposal',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
      },
    } as unknown) as RawEvent;
    const result = await processor.process(event);
    assert.isEmpty(result);
  });

  it('should gracefully fail to process an event with invalid api call', async () => {
    const processor = new Processor(
      ({
        provider: {
          getBlock: () => {
            throw new Error('fail!');
          },
        },
      } as unknown) as Api,
      1
    );
    const event = ({
      event: 'SubmitProposal',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
        memberAddress: 'member',
        delegateKey: 'member',
        applicant: 'applicant',
        tokenTribute: toHex(5),
        sharesRequested: toHex(6),
      },
    } as unknown) as RawEvent;
    const result = await processor.process(event);
    assert.isEmpty(result);
  });
});
