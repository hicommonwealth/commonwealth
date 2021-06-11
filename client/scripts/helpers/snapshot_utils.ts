import { getBlockNumber } from '@snapshot-labs/snapshot.js/src/utils/web3';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';
import { ipfsGet } from '@snapshot-labs/snapshot.js/src/utils';
import gateways from '@snapshot-labs/snapshot.js/src/gateways.json';
import client from 'helpers/snapshot_client';

const gateway = process.env.SNAPSHOT_IPFS_GATEWAY || gateways[0];

declare global {
  interface ObjectConstructor {
    fromEntries(xs: [string|number|symbol, any][]): object
  }
}

export const fromEntries = (xs: [string|number|symbol, any][]) =>
  Object.fromEntries ? Object.fromEntries(xs) : xs.reduce((acc, [key, value]) => ({...acc, [key]: value}), {})

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
    const provider = getProvider(space.network);
    const response = await Promise.all([
      ipfsGet(gateway, id),
      client.getVotes(space.key, id),
      getBlockNumber(provider)
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