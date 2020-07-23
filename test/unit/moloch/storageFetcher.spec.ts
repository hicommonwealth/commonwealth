import chai from 'chai';
import { StorageFetcher } from '../../../src/moloch/storageFetcher';
import { ProposalV1, EventKind } from '../../../src/moloch/types';
import { Moloch1 } from '../../../eth/types/Moloch1';

const { assert } = chai;

const makeApi = (proposals: ProposalV1[]) => {
  return {
    periodDuration: async () => '1',
    summoningTime: async () => '2',
    votingPeriodLength: async () => '3',
    gracePeriodLength: async () => '2',
    abortWindow: async () => '2',
    getProposalQueueLength: async () => proposals.length,
    proposalQueue: async (n: number) => proposals[n],
    provider: {
      getBlock: async (n: number) => ({ timestamp: n * 1000 }),
      getBlockNumber: async () => 200,
    }
  } as unknown as Moloch1;
};

const makeDater = (minAvailableBlock = 0) => {
  return {
    getDate: (timestamp) => {
      if (!timestamp) throw new Error('no timestamp given');
      if ((timestamp / 1000) < minAvailableBlock) return undefined;
      return {
        date: `${timestamp / 1000}`,
        block: timestamp / 1000,
      };
    }
  };
};

describe('Moloch Storage Fetcher Tests', () => {
  it('should run gracefully with nothing in storage', async () => {
    const api = makeApi([]);
    const fetcher = new StorageFetcher(api, 1, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, []);
  });

  it('should fetch an active moloch1 proposal from storage', async () => {
    const proposals: ProposalV1[] = [{
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
    } as unknown as ProposalV1];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api, 1, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [{
      blockNumber: 3,
      data: {
        kind: EventKind.SubmitProposal,
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
    const proposals: ProposalV1[] = [{
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
    } as unknown as ProposalV1];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api, 1, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [
      {
        blockNumber: 3,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 5,
        data: {
          kind: EventKind.Abort,
          proposalIndex: 0,
          applicant: 'applicant',
        }
      },
    ]);
  });

  // TODO: write test where we are still in abort window to verify block # synthesis

  it('should fetch a processed moloch1 proposal from storage', async () => {
    const proposals: ProposalV1[] = [{
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
    } as unknown as ProposalV1];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api, 1, makeDater());
    const fetched = await fetcher.fetch();
    assert.deepEqual(fetched, [
      {
        blockNumber: 3,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 8,
        data: {
          kind: EventKind.ProcessProposal,
          proposalIndex: 0,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: true,
          yesVotes: '2',
          noVotes: '3',
        }
      },
    ]);
  });

  it('should accept a range parameter with/without endBlock', async () => {
    const proposals: ProposalV1[] = [
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
      } as unknown as ProposalV1,
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
      } as unknown as ProposalV1,
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
      } as unknown as ProposalV1,
    ];
    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api, 1, makeDater());
    const range = { startBlock: 9 };
    const fetched = await fetcher.fetch(range);
    assert.sameDeepMembers(fetched.filter((p) => (p.data as any).proposalIndex === 0), []);
    assert.sameDeepMembers(fetched.filter((p) => (p.data as any).proposalIndex === 1), [
      {
        blockNumber: 12,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 17,
        data: {
          kind: EventKind.ProcessProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: false,
          yesVotes: '2',
          noVotes: '3',
        }
      },
    ]);
    assert.sameDeepMembers(fetched.filter((p) => (p.data as any).proposalIndex === 2), [
      {
        blockNumber: 102,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 12,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 17,
        data: {
          kind: EventKind.ProcessProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: false,
          yesVotes: '2',
          noVotes: '3',
        }
      },
    ]);
  });

  it('should terminate fetch on completed due to argument', async () => {
    const proposals: ProposalV1[] = [
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
      } as unknown as ProposalV1,
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
      } as unknown as ProposalV1,
    ];

    const api = makeApi(proposals);
    const fetcher = new StorageFetcher(api, 1, makeDater());

    // should only fetch the first/most recent completed proposal
    const fetched = await fetcher.fetch(null, false);
    assert.sameDeepMembers(fetched, [
      {
        blockNumber: 12,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 17,
        data: {
          kind: EventKind.ProcessProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: false,
          yesVotes: '2',
          noVotes: '3',
        }
      },
    ]);

    // should fetch both completed proposals
    const fetchedAll = await fetcher.fetch(null, true);
    assert.sameDeepMembers(fetchedAll.filter((p) => (p.data as any).proposalIndex === 0), [
      {
        blockNumber: 3,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 8,
        data: {
          kind: EventKind.ProcessProposal,
          proposalIndex: 0,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: false,
          yesVotes: '2',
          noVotes: '3',
        }
      },
    ]);
    assert.sameDeepMembers(fetchedAll.filter((p) => (p.data as any).proposalIndex === 1), [
      {
        blockNumber: 12,
        data: {
          kind: EventKind.SubmitProposal,
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
        blockNumber: 17,
        data: {
          kind: EventKind.ProcessProposal,
          proposalIndex: 1,
          member: 'proposer',
          applicant: 'applicant',
          tokenTribute: '4',
          sharesRequested: '2',
          didPass: false,
          yesVotes: '2',
          noVotes: '3',
        }
      },
    ]);
  });

  it('should throw error on proposal error', (done) => {
    const api = makeApi([{
      startingPeriod: '1',
    } as any]);
    const fetcher = new StorageFetcher(api, 1, makeDater());
    fetcher.fetch().then(() => {
      done('should throw on proposal error');
    }).catch((err) => {
      done();
    });
  });

  it('should throw error on api error', (done) => {
    const api = {} as any;
    const fetcher = new StorageFetcher(api, 1, makeDater());
    fetcher.fetch().then(() => {
      done('should throw on api error');
    }).catch((err) => {
      done();
    });
  });

  // TODO: dater fail tests
});
