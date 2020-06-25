import chai from 'chai';
import { MolochEventKind, MolochRawEvent, MolochApi } from '../../../../shared/events/moloch/types';
import MolochEnricherFunc from '../../../../shared/events/moloch/filters/enricher';

const { assert } = chai;

const constructEvent = (data: object, section = '', typeDef: string[] = []): MolochRawEvent => {
  return {
    args: data,
  } as MolochRawEvent;
};

const blockNumber = 10000;
const api: MolochApi = {
  proposalQueue: async (n) => ({ startingPeriod: '1', details: 'hello', yesVotes: '5', noVotes: '4' }),
  periodDuration: async () => '2',
  summoningTime: async () => '0',
  members: async (addr) => ({ delegateKey: addr, shares: '10', exists: true, highestIndexYesVote: 1 }),
} as unknown as MolochApi;

const toHex = (n: number | string) => ({ _hex: `0x${n.toString(16)}` });

describe('Moloch Event Enricher Filter Tests', () => {
  it('should enrich submit proposal event', async () => {
    const kind = MolochEventKind.SubmitProposal;
    const event = constructEvent({
      proposalIndex: toHex(1),
      delegateKey: 'delegate',
      memberAddress: 'member',
      applicant: 'applicant',
      tokenTribute: toHex(5),
      sharesRequested: toHex(6),
    });
    const result = await MolochEnricherFunc(1, api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'member' ],
      data: {
        kind,
        proposalIndex: 1,
        delegateKey: 'delegate',
        member: 'member',
        applicant: 'applicant',
        tokenTribute: '5',
        sharesRequested: '6',
        details: 'hello',
        startTime: 2,
      }
    });
  });

  it('should enrich submit vote event', async () => {
    const kind = MolochEventKind.SubmitVote;
    const event = constructEvent({
      proposalIndex: toHex(1),
      delegateKey: 'delegate',
      memberAddress: 'member',
      uintVote: 1,
    });
    const result = await MolochEnricherFunc(1, api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'member' ],
      data: {
        kind,
        proposalIndex: 1,
        delegateKey: 'delegate',
        member: 'member',
        vote: 1,
        shares: '10',
        highestIndexYesVote: 1,
      }
    });
  });

  it('should enrich process proposal event', async () => {
    const kind = MolochEventKind.ProcessProposal;
    const event = constructEvent({
      proposalIndex: toHex(1),
      applicant: 'applicant',
      memberAddress: 'member',
      tokenTribute: toHex(5),
      sharesRequested: toHex(6),
      didPass: true,
      yesVotes: toHex(5),
      noVotes: toHex(4),
    });
    const result = await MolochEnricherFunc(1, api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        proposalIndex: 1,
        member: 'member',
        applicant: 'applicant',
        tokenTribute: '5',
        sharesRequested: '6',
        didPass: true,
        yesVotes: '5',
        noVotes: '4',
      }
    });
  });

  it('should enrich ragequit event', async () => {
    const kind = MolochEventKind.Ragequit;
    const event = constructEvent({
      memberAddress: 'member',
      sharesToBurn: toHex(10),
    });
    const result = await MolochEnricherFunc(1, api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'member' ],
      data: {
        kind,
        member: 'member',
        sharesToBurn: '10',
      }
    });
  });

  it('should enrich abort event', async () => {
    const kind = MolochEventKind.Abort;
    const event = constructEvent({
      proposalIndex: toHex(1),
      applicantAddress: 'applicant',
    });
    const result = await MolochEnricherFunc(1, api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      excludeAddresses: [ 'applicant' ],
      data: {
        kind,
        proposalIndex: 1,
        applicant: 'applicant',
      }
    });
  });

  it('should enrich update delegate key event', async () => {
    const kind = MolochEventKind.UpdateDelegateKey;
    const event = constructEvent({
      memberAddress: 'member',
      newDelegateKey: 'new-delegate',
    });
    const result = await MolochEnricherFunc(1, api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      includeAddresses: [ 'new-delegate' ],
      data: {
        kind,
        member: 'member',
        newDelegateKey: 'new-delegate',
      }
    });
  });

  it('should enrich summon complete event', async () => {
    const kind = MolochEventKind.SummonComplete;
    const event = constructEvent({
      summoner: 'summoner',
      shares: toHex(5),
    });
    const result = await MolochEnricherFunc(1, api, blockNumber, kind, event);
    assert.deepEqual(result, {
      blockNumber,
      data: {
        kind,
        summoner: 'summoner',
        shares: '5',
      }
    });
  });
});
