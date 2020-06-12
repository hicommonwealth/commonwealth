import chai from 'chai';
import Processor from '../../../../shared/events/moloch/processor';
import { MolochApi, MolochRawEvent, MolochEventKind } from '../../../../shared/events/moloch/types';
const { assert } = chai;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

describe('Moloch Event Processor Tests', () => {
  it('should process a raw event into a CWEvent', async () => {
    const processor = new Processor(1, {} as MolochApi);
    const event = {
      event: 'SubmitProposal',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
        delegateKey: 'delegate',
        memberAddress: 'member',
        applicant: 'applicant',
        tokenTribute: toHex(5),
        sharesRequested: toHex(6),
      }
    } as unknown as MolochRawEvent;
    const result = await processor.process(event);
    assert.deepEqual(result, [{
      blockNumber: 10,
      excludeAddresses: [ 'member' ],
      data: {
        kind: MolochEventKind.SubmitProposal,
        proposalIndex: 1,
        delegateKey: 'delegate',
        member: 'member',
        applicant: 'applicant',
        tokenTribute: '5',
        sharesRequested: '6',
      }
    }]);
  });

  it('should gracefully fail to process an event with invalid type', async () => {
    const processor = new Processor(1, {} as MolochApi);
    const event = {
      event: 'NothingHappened',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
      }
    } as unknown as MolochRawEvent;
    const result = await processor.process(event);
    assert.isEmpty(result);
  });

  it('should gracefully fail to process an event with invalid data', async () => {
    const processor = new Processor(1, {} as MolochApi);
    const event = {
      event: 'SubmitProposal',
      blockNumber: 10,
      args: {
        proposalIndex: toHex(1),
      }
    } as unknown as MolochRawEvent;
    const result = await processor.process(event);
    assert.isEmpty(result);
  });
});
