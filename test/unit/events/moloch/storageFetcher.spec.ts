import chai from 'chai';
import Fetcher from '../../../../shared/events/moloch/storageFetcher';
import { Moloch1Proposal, MolochEventKind } from '../../../../shared/events/moloch/types';
import { Moloch1 } from '../../../../eth/types/Moloch1';

const { assert } = chai;

const makeApi = (proposals: Moloch1Proposal[]) => {
  return {
    periodDuration: async () => '1',
    summoningTime: async () => '2',
    getProposalQueueLength: async () => proposals.length,
    proposalQueue: async (n: number) => proposals[n],
    provider: {
      getBlock: async (n: number) => ({ timestamp: n }),
      getBlockNumber: async () => 200,
    }
  } as unknown as Moloch1;
};

describe('Moloch Storage Fetcher Tests', () => {
  it('should run gracefully with nothing in storage', async () => {
    const api = makeApi([]);
    const fetcher = new Fetcher(api, 1);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });

  it('should fetch an active moloch1 proposal from storage', async () => {
    const proposals: Moloch1Proposal[] = [{
      proposer: 'proposer',
      applicant: 'applicant',
      sharesRequested: '2',
      startingPeriod: '1',
      yesVotes: '2',
      noVotes: '3',
      processed: false,
      didPass: false,
      aborted: false,
      tokenTribute: '4',
      details: 'test',
      maxTotalSharesAtYesVote: '2',
    } as unknown as Moloch1Proposal];
    const api = makeApi(proposals);
    const fetcher = new Fetcher(api, 1);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [{
      blockNumber: 0,
      data: {
        kind: MolochEventKind.SubmitProposal,
        proposalIndex: 0,
        member: 'proposer',
        applicant: 'applicant',
        tokenTribute: '4',
        sharesRequested: '2',
        details: 'test',
        startTime: 3,
      }
    }]);
  });

  it('should fetch an aborted moloch1 proposal from storage', async () => {
    const proposals: Moloch1Proposal[] = [{
      proposer: 'proposer',
      applicant: 'applicant',
      sharesRequested: '2',
      startingPeriod: '1',
      yesVotes: '2',
      noVotes: '3',
      processed: false,
      didPass: false,
      aborted: true,
      tokenTribute: '4',
      details: 'test',
      maxTotalSharesAtYesVote: '2',
    } as unknown as Moloch1Proposal];
    const api = makeApi(proposals);
    const fetcher = new Fetcher(api, 1);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [
      {
        blockNumber: 0,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: 0,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          details: 'test',
          startTime: 3,
        }
      },
      {
        blockNumber: 1,
        data: {
          kind: MolochEventKind.Abort,
          proposalIndex: 0,
          applicant: 'applicant',
        }
      },
    ]);
  });

  it('should fetch a processed moloch1 proposal from storage', async () => {
    const proposals: Moloch1Proposal[] = [{
      proposer: 'proposer',
      applicant: 'applicant',
      sharesRequested: '2',
      startingPeriod: '1',
      yesVotes: '2',
      noVotes: '3',
      processed: true,
      didPass: true,
      aborted: false,
      tokenTribute: '4',
      details: 'test',
      maxTotalSharesAtYesVote: '2',
    } as unknown as Moloch1Proposal];
    const api = makeApi(proposals);
    const fetcher = new Fetcher(api, 1);
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [
      {
        blockNumber: 0,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: 0,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          details: 'test',
          startTime: 3,
        }
      },
      {
        blockNumber: 1,
        data: {
          kind: MolochEventKind.ProcessProposal,
          proposalIndex: 0,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: true,
        }
      },
    ]);
  });

  it('should accept a range parameter with/without endBlock', async () => {
    const proposals: Moloch1Proposal[] = [
      {
        proposer: 'proposer',
        applicant: 'applicant',
        sharesRequested: '2',
        startingPeriod: '1',
        yesVotes: '2',
        noVotes: '3',
        processed: true,
        didPass: false,
        aborted: false,
        tokenTribute: '4',
        details: 'test',
        maxTotalSharesAtYesVote: '2',
      } as unknown as Moloch1Proposal,
      {
        proposer: 'proposer',
        applicant: 'applicant',
        sharesRequested: '2',
        startingPeriod: '10',
        yesVotes: '2',
        noVotes: '3',
        processed: true,
        didPass: false,
        aborted: false,
        tokenTribute: '4',
        details: 'test',
        maxTotalSharesAtYesVote: '2',
      } as unknown as Moloch1Proposal,
      {
        proposer: 'proposer',
        applicant: 'applicant',
        sharesRequested: '2',
        startingPeriod: '100',
        yesVotes: '2',
        noVotes: '3',
        processed: false,
        didPass: false,
        aborted: false,
        tokenTribute: '4',
        details: 'test',
        maxTotalSharesAtYesVote: '2',
      } as unknown as Moloch1Proposal,
    ];
    const api = makeApi(proposals);
    const fetcher = new Fetcher(api, 1);
    const range = { startBlock: 9 };
    const fetched = await fetcher.fetch(range);
    assert.sameDeepMembers(fetched.filter((p) => (p.data as any).proposalIndex === 0), []);
    assert.sameDeepMembers(fetched.filter((p) => (p.data as any).proposalIndex === 1), [
      {
        blockNumber: 9,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          details: 'test',
          startTime: 12,
        }
      },
      {
        blockNumber: 10,
        data: {
          kind: MolochEventKind.ProcessProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: false,
        }
      },
    ]);
    assert.sameDeepMembers(fetched.filter((p) => (p.data as any).proposalIndex === 2), [
      {
        blockNumber: 9,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: 2,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          details: 'test',
          startTime: 102,
        }
      },
    ]);

    const rangeWithEnd = { startBlock: 9, endBlock: 20 };
    const fetchedWithEnd = await fetcher.fetch(rangeWithEnd);
    assert.sameDeepMembers(fetchedWithEnd, [
      {
        blockNumber: 9,
        data: {
          kind: MolochEventKind.SubmitProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          details: 'test',
          startTime: 12,
        }
      },
      {
        blockNumber: 10,
        data: {
          kind: MolochEventKind.ProcessProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: false,
        }
      },
    ]);
  });

  it('should throw error on proposal error', (done) => {
    const api = makeApi([{
      startingPeriod: '1',
    } as any]);
    const fetcher = new Fetcher(api, 1);
    fetcher.fetch().then(() => {
      done('should throw on proposal error');
    }).catch((err) => {
      done();
    });
  });

  it('should throw error on api error', (done) => {
    const api = {} as any;
    const fetcher = new Fetcher(api, 1);
    fetcher.fetch().then(() => {
      done('should throw on api error');
    }).catch((err) => {
      done();
    });
  });
});
