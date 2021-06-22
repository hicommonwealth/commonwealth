import gateways from './gateways.json';
import networks from './networks.json';
import numeral from 'numeral';
import Snapshot from '@snapshot-labs/snapshot.js';

import client from 'helpers/snapshot_utils/snapshot_client';

const gateway = process.env.SNAPSHOT_IPFS_GATEWAY || gateways[0];

export function jsonParse(input, fallback?) {
	if (typeof input !== 'string') {
		return fallback || {};
	}
	try {
		return JSON.parse(input);
	} catch (err) {
		return fallback || {};
	}
}

export function formatSpace(key, space) {
	space = {
		key,
		...space,
		members: space.members || [],
		filters: space.filters || {}
	};
	if (!space.filters.minScore) space.filters.minScore = 0;
	return space;
}

export function formatProposal(proposal) {
  proposal.msg = jsonParse(proposal.msg, proposal.msg);

  // v0.1.0
  if (proposal.msg.version === '0.1.0') {
    proposal.msg.payload.start = 1595088000;
    proposal.msg.payload.end = 1595174400;
    proposal.msg.payload.snapshot = 10484400;
    proposal.bpt_voting_disabled = '1';
  }

  // v0.1.1
  if (proposal.msg.version === '0.1.0' || proposal.msg.version === '0.1.1') {
    proposal.msg.payload.metadata = {};
  }

  return proposal;
}

export async function getProposal(space, id) {
  try {
    console.time('getProposal.data');
    const provider = Snapshot.utils.getProvider(space.network);
    const response = await Promise.all([
      Snapshot.utils.ipfsGet(gateway, id),
      client.getVotes(space.key, id),
      Snapshot.utils.getBlockNumber(provider),
    ]);
    console.timeEnd('getProposal.data');
    const [, votes, blockNumber] = response;
    let [proposal]: any = response;
    proposal = formatProposal(proposal);
    proposal.ipfsHash = id;
    return { proposal, votes, blockNumber };
  } catch (e) {
    console.log(e);
    return e;
  }
}

export async function getPower(space, address, snapshot) {
  try {
    const blockNumber = await Snapshot.utils.getBlockNumber(Snapshot.utils.getProvider(space.network));
    const blockTag = snapshot > blockNumber ? 'latest' : parseInt(snapshot);
    let scores: any = await Snapshot.utils.getScores(
      space.key,
      space.strategies,
      space.network,
      Snapshot.utils.getProvider(space.network),
      [address],
      // @ts-ignore
      blockTag
    );
    scores = scores.map((score: any) =>
      Object.values(score).reduce((a, b: any) => a + b, 0)
    );
    return {
      scores,
      totalScore: scores.reduce((a, b: any) => a + b, 0)
    };
  } catch (e) {
    console.log(e);
    return e;
  }
}

export function _explorer(network, str: string, type = 'address'): string {
  return `${networks[network].explorer}/${type}/${str}`;
}

export function _n(number, format = '(0.[00]a)') {
  if (number < 0.00001) return 0;
  return numeral(number).format(format);
}

export function shorten(str = '') {
  return `${str.slice(0, 6)}...${str.slice(str.length - 4)}`;
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
  return shorten(str);
}
