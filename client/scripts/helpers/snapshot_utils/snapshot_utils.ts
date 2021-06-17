import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { getBlockNumber } from '@snapshot-labs/snapshot.js/src/utils/web3';
import getProvider from '@snapshot-labs/snapshot.js/src/utils/provider';
import gateways from '@snapshot-labs/snapshot.js/src/gateways.json';
import networks from '@snapshot-labs/snapshot.js/src/networks.json';
import numeral from 'numeral';

import client from 'helpers/snapshot_utils/snapshot_client';
import { abi as multicallAbi } from './abi/Multicall.json';
import _strategies from './strategies';

const gateway = process.env.SNAPSHOT_IPFS_GATEWAY || gateways[0];

export const MULTICALL = {
  '1': '0xeefba1e63905ef1d7acba5a8513c70307c1ce441',
  '3': '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  '4': '0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821',
  '5': '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  '6': '0x53c43764255c17bd724f74c4ef150724ac50a3ed',
  '17': '0xB9cb900E526e7Ad32A2f26f1fF6Dee63350fcDc5',
  '30': '0x4eeebb5580769ba6d26bfd07be636300076d1831',
  '31': '0x4eeebb5580769ba6d26bfd07be636300076d1831',
  '42': '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  '56': '0x1ee38d535d541c55c9dae27b12edf090c608e6fb',
  '70': '0xd4b794b89baccb70ef851830099bee4d69f19ebc',
  '65': '0x23Daae12B7f82b1f0A276cD4f49825DE940B6374',
  '66': '0x5031F781E294bD918CfCf5aB7fe57196DeAA7Efb',
  '82': '0x579De77CAEd0614e3b158cb738fcD5131B9719Ae',
  '97': '0x8b54247c6BAe96A6ccAFa468ebae96c4D7445e46',
  '100': '0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a',
  '128': '0x37ab26db3df780e7026f3e767f65efb739f48d8e',
  '137': '0xCBca837161be50EfA5925bB9Cc77406468e76751',
  '256': '0xC33994Eb943c61a8a59a918E2de65e03e4e385E0',
  '1287': '0xD7bA481DE7fB53A7a29641c43232B09e5D9CAe7b',
  '1337': '0x566131e85d46cc7BBd0ce5C6587E9912Dc27cDAc',
  '2109': '0x7E9985aE4C8248fdB07607648406a48C76e9e7eD',
  wanchain: '0xba5934ab3056fca1fa458d30fbb3810c3eb5145f',
  '250': '0x7f6A10218264a22B4309F3896745687E712962a0',
  '499': '0x7955FF653FfDBf13056FeAe227f655CfF5C194D5',
  '1666600000': '0x9c31392D2e0229dC4Aa250F043d46B9E82074BF8',
  '1666700000': '0x9923589503Fd205feE3d367DDFF2378f0F7dD2d4'
  };

export const SNAPSHOT_SUBGRAPH_URL = {
  '1': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot',
  '4': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-rinkeby',
  '42': 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot-kovan'
};

export async function call(provider, abi: any[], call: any[], options?) {
  const contract = new Contract(call[0], abi, provider);
  try {
    const params = call[2] || [];
    return await contract[call[1]](...params, options || {});
  } catch (e) {
    return Promise.reject(e);
  }
}

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

export async function ipfsGet(
  gateway: string,
  ipfsHash: string,
  protocolType: string = 'ipfs'
) {
  const url = `https://${gateway}/${protocolType}/${ipfsHash}`;
  return fetch(url).then((res) => res.json());
}

export async function subgraphRequest(url: string, query, options: any = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify({ query: jsonToGraphQLQuery({ query }) })
  });
  const { data } = await res.json();
  return data || {};
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

export async function multicall(
  network: string,
  provider,
  abi: any[],
  calls: any[],
  options?
) {
  const multi = new Contract(MULTICALL[network], multicallAbi, provider);
  const itf = new Interface(abi);
  try {
    const [, res] = await multi.aggregate(
      calls.map((call) => [
        call[0].toLowerCase(),
        itf.encodeFunctionData(call[1], call[2])
      ]),
      options || {}
    );
    return res.map((call, i) => itf.decodeFunctionResult(calls[i][1], call));
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function getScores(
  space: string,
  strategies: any[],
  network: string,
  provider,
  addresses: string[],
  snapshot: number | string = 'latest'
) {
  try {
    return await Promise.all(
      strategies.map((strategy) =>
        (snapshot !== 'latest' && strategy.params?.start > snapshot) ||
        (strategy.params?.end &&
          (snapshot === 'latest' || snapshot > strategy.params?.end)) ||
        addresses.length === 0
          ? {}
          : _strategies[strategy.name](
              space,
              network,
              provider,
              addresses,
              strategy.params,
              snapshot
            )
      )
    );
  } catch (e) {
    return Promise.reject(e);
  }
}

export async function getPower(space, address, snapshot) {
  try {
    const blockNumber = await getBlockNumber(getProvider(space.network));
    const blockTag = snapshot > blockNumber ? 'latest' : parseInt(snapshot);
    let scores: any = await getScores(
      space.key,
      space.strategies,
      space.network,
      getProvider(space.network),
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
