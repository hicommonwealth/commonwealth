import { cloneDeep } from 'lodash';
import numeral from 'numeral';
import Snapshot from '@snapshot-labs/snapshot.js';
import { apolloClient, PROPOSAL_VOTES_QUERY, PROPOSALS_QUERY, SPACE_QUERY } from 'helpers/apollo';

export interface SnapshotSpace {
  id: string;
  name: string;
  about: string;
  symbol: string;
  private: boolean;
  network: string;
  filters: {
    minScore: number,
    onlyMembers: boolean,
  }
  strategies: Array<{
    name: string;
    params: any;
  }>;
  members: string[];
}

export interface SnapshotProposal {
  id: string;
  ipfs: string;
  author: string;
  created: number;
  start: number;
  end: number;
  title: string;
  body: string
  snapshot: string;
  choices: string[];
}

export interface SnapshotProposalVote {
  id: string;
  voter: string;
  created: number;
  choice: number;
}

export async function getSpace(space: string): Promise<SnapshotSpace> {
  const spaceObj = await apolloClient.query({
    query: SPACE_QUERY,
    variables: {
      space,
    }
  });
  return spaceObj.data.space;
}

export async function getProposals(space: string): Promise<SnapshotProposal[]> {
  const proposalsObj = await apolloClient.query({
    query: PROPOSALS_QUERY,
    variables: {
      space,
      state: 'all',
      // TODO: pagination in UI
      first: 1000,
      skip: 0,
    }
  });
  return proposalsObj.data.proposals;
}

export async function getVotes(proposalHash: string): Promise<SnapshotProposalVote[]> {
  const response = await apolloClient.query({
    query: PROPOSAL_VOTES_QUERY,
    variables: {
      proposalHash
    }
  });
  return response.data.votes;
}

export async function getPower(space: SnapshotSpace, address, snapshot) {
  try {
    // TODO: do without snapshotjs
    const blockNumber = await Snapshot.utils.getBlockNumber(Snapshot.utils.getProvider(space.network));
    const blockTag = snapshot > blockNumber ? 'latest' : parseInt(snapshot, 10);
    let scores: any = await Snapshot.utils.getScores(
      space.id,
      space.strategies,
      space.network,
      Snapshot.utils.getProvider(space.network),
      [address],
      blockTag
    );
    scores = scores.map((score: any) => Object.values(score).reduce((a, b: any) => a + b, 0));
    return {
      scores,
      totalScore: scores.reduce((a, b: any) => a + b, 0)
    };
  } catch (e) {
    console.log(e);
    return e;
  }
}

export function _n(number: number, format = '(0.[00]a)') {
  if (number < 0.00001) return 0;
  return numeral(number).format(format);
}

export function _shorten(str: string, key?: any): string {
  if (!str) return str;
  let limit;
  if (typeof key === 'number') limit = key;
  if (key === 'symbol') limit = 6;
  if (key === 'name') limit = 64;
  if (key === 'choice') limit = 12;
  if (limit)
    return str.length > limit ? `${str.slice(0, limit).trim()}...` : str;
  return `${str.slice(0, 6)}...${str.slice(str.length - 4)}`;
}
