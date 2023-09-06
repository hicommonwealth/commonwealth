import { ChainInstance } from '../models/chain';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../config';
import {
  ProposalSDKType,
  ProposalStatus,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { LCDQueryClient as GovV1Client } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query.lcd';
import { numberToLong } from 'common-common/src/cosmos-ts/src/codegen/helpers';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  filterV1GovChains,
  mapChainsToProposals,
  numberToUint8ArrayBE,
  processProposalSettledPromises,
  uint8ArrayToNumberBE,
} from './util';
import { GovExtension, QueryClient, setupGovExtension } from '@cosmjs/stargate';
import { factory, formatFilename } from 'common-common/src/logging';
import { PageRequest } from 'common-common/src/cosmos-ts/src/codegen/cosmos/base/query/v1beta1/pagination';
import Rollbar from 'rollbar';

export type AllCosmosProposals = {
  v1: { [chainId: string]: ProposalSDKType[] };
  v1Beta1: { [chainId: string]: Proposal[] };
};

export type GovV1Beta1ClientType = QueryClient & GovExtension;
type CosmosClientType = GovV1Beta1ClientType | GovV1Client;

export const CosmosClients: Record<string, CosmosClientType> = {};
const log = factory.getLogger(formatFilename(__filename));

async function getCosmosClient<
  CosmosClient extends GovV1Beta1ClientType | GovV1Client
>(chain: ChainInstance): Promise<CosmosClient> {
  if (CosmosClients[chain.id]) return CosmosClients[chain.id] as CosmosClient;

  if (COSMOS_GOV_V1_CHAIN_IDS.includes(chain.id)) {
    const { createLCDClient } = await import(
      'common-common/src/cosmos-ts/src/codegen/cosmos/lcd'
    );
    const result = await createLCDClient({
      restEndpoint: chain.ChainNode.alt_wallet_url,
    });

    CosmosClients[chain.id] = result.cosmos.gov.v1;
    return CosmosClients[chain.id] as CosmosClient;
  } else {
    const tm = await import('@cosmjs/tendermint-rpc');
    const tmClient = await tm.Tendermint34Client.connect(
      chain.ChainNode.url || chain.ChainNode.private_url
    );
    CosmosClients[chain.id] = QueryClient.withExtensions(
      tmClient,
      setupGovExtension
    );
    return CosmosClients[chain.id] as CosmosClient;
  }
}

/**
 * Fetches the most recent (latest) proposal from a Cosmos chain that uses the v1 gov module. Depending on the
 * Cosmos SDK version the chain is built with, the fetching can be optimized by using varying pagination values.
 * See /gov/v1beta1/proposals at https://v1.cosmos.network/rpc/v0.45.1 for more details on pagination values.
 * @param chain
 */
async function fetchLatestCosmosProposalV1(
  chain: ChainInstance
): Promise<ProposalSDKType[]> {
  const client = await getCosmosClient<GovV1Client>(chain);
  let nextKey: Uint8Array, finalProposalsPage: ProposalSDKType[];
  do {
    const { proposals, pagination } = await client.proposals({
      proposalStatus: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
      depositor: '',
      voter: '',
      pagination: nextKey ? ({ key: nextKey } as PageRequest) : undefined,
    });
    finalProposalsPage = proposals;
    if (pagination?.next_key) {
      if (Number(pagination.total) != 0) {
        const newNextKey = numberToUint8ArrayBE(Number(pagination.total));
        if (nextKey != newNextKey) {
          nextKey = newNextKey;
        } else {
          nextKey = numberToUint8ArrayBE(0);
        }
      } else nextKey = pagination.next_key;
    }
  } while (uint8ArrayToNumberBE(nextKey) > 0);

  if (finalProposalsPage.length > 0) {
    log.info(
      `Fetched proposal ${
        finalProposalsPage[finalProposalsPage.length - 1].id
      } from ${chain.id}`
    );
    return [finalProposalsPage[finalProposalsPage.length - 1]];
  } else return [];
}

/**
 * Attempts to fetch the proposal at the given proposalId from a Cosmos chain that uses the v1 gov module. If a proposal
 * with the given id exists, the function attempts to fetch the next proposal. This process repeats until no proposal
 * is found.
 * @param proposalId The proposal id to start fetching proposals at.
 * @param chain
 */
async function fetchUpToLatestCosmosProposalV1(
  proposalId: number,
  chain: ChainInstance
): Promise<ProposalSDKType[]> {
  const client = await getCosmosClient<GovV1Client>(chain);

  const proposals: ProposalSDKType[] = [];
  do {
    let proposal: ProposalSDKType;
    try {
      const result = await client.proposal({
        proposalId: numberToLong(proposalId),
      });
      proposal = result.proposal;
    } catch (e) {
      if (!e.message.includes('rpc error: code = NotFound')) {
        throw e;
      }
    }

    if (proposal) {
      proposals.push(proposal);
      proposalId++;
    } else break;
  } while (true);

  return proposals;
}

/**
 * See {@Link fetchLatestCosmosProposalV1}. Same logic applies, but for Cosmos chains that use the v1beta1 gov module.
 * @param chain
 */
async function fetchLatestCosmosProposalV1Beta1(
  chain: ChainInstance
): Promise<Proposal[]> {
  const client = await getCosmosClient<GovV1Beta1ClientType>(chain);

  let nextKey: Uint8Array, finalProposalsPage: Proposal[];
  do {
    const { proposals, pagination } = await client.gov.proposals(
      ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
      '',
      '',
      nextKey
    );
    finalProposalsPage = proposals;
    if (pagination) {
      if (!pagination?.total.isZero()) {
        const newNextKey = numberToUint8ArrayBE(pagination.total.toNumber());
        if (nextKey != newNextKey) {
          nextKey = newNextKey;
        } else {
          nextKey = numberToUint8ArrayBE(0);
        }
      } else nextKey = pagination?.nextKey;
    }
  } while (uint8ArrayToNumberBE(nextKey) > 0);

  if (finalProposalsPage.length > 0) {
    log.info(
      `Fetched proposal ${finalProposalsPage[
        finalProposalsPage.length - 1
      ].proposalId.toNumber()} from ${chain.id}`
    );
    return [finalProposalsPage[finalProposalsPage.length - 1]];
  } else return [];
}

/**
 * See {@Link fetchUpToLatestCosmosProposalV1}. Same logic applies, but for Cosmos chains that use the
 * v1beta1 gov module.
 */
async function fetchUpToLatestCosmosProposalV1Beta1(
  proposalId: number,
  chain: ChainInstance
): Promise<Proposal[]> {
  log.info(
    `Fetching proposals from '${chain.id}' starting at proposal id ${proposalId}`
  );
  const client = await getCosmosClient<GovV1Beta1ClientType>(chain);

  const proposals: Proposal[] = [];
  do {
    let proposal: Proposal;
    try {
      const result = await client.gov.proposal(proposalId);
      proposal = result.proposal;
    } catch (e) {
      if (!e.message.includes('rpc error: code = NotFound')) {
        throw e;
      }
    }

    if (proposal) {
      proposals.push(proposal);
      proposalId++;
    } else break;
  } while (true);

  log.info(`Fetched ${proposals.length} proposals from ${chain.id}.`);
  return proposals;
}

/**
 * Fetches all proposals from the given proposal ids to the latest proposal for each chain. Works for both v1 and
 * v1beta1 gov modules.
 * @param chains
 * @param latestProposalIds
 * @param rollbar
 * @returns {@Link AllCosmosProposals} An object containing all proposals for each chain, separated
 * by gov module version.
 */
export async function fetchUpToLatestCosmosProposals(
  chains: ChainInstance[],
  latestProposalIds: Record<string, number>,
  rollbar?: Rollbar
): Promise<AllCosmosProposals> {
  if (chains.length === 0) return { v1: {}, v1Beta1: {} };

  const { v1Chains, v1Beta1Chains } = filterV1GovChains(chains);
  log.info(
    `Fetching up to the latest proposals from ${JSON.stringify(
      v1Chains.map((c) => c.id)
    )} v1 gov chain(s)` +
      ` and ${JSON.stringify(
        v1Beta1Chains.map((c) => c.id)
      )} v1beta1 gov chain(s)`
  );

  const [v1ProposalResults, v1BetaProposalResults] = await Promise.all([
    Promise.allSettled(
      v1Chains.map((c) =>
        fetchUpToLatestCosmosProposalV1(latestProposalIds[c.id] + 1, c)
      )
    ),
    Promise.allSettled(
      v1Beta1Chains.map((c) =>
        fetchUpToLatestCosmosProposalV1Beta1(latestProposalIds[c.id] + 1, c)
      )
    ),
  ]);

  const { v1Proposals, v1Beta1Proposals } = processProposalSettledPromises(
    v1ProposalResults,
    v1BetaProposalResults,
    rollbar
  );

  return mapChainsToProposals(
    v1Chains,
    v1Beta1Chains,
    v1Proposals,
    v1Beta1Proposals
  );
}

export async function fetchLatestProposals(
  chains: ChainInstance[],
  rollbar?: Rollbar
): Promise<AllCosmosProposals> {
  if (chains.length === 0) return { v1: {}, v1Beta1: {} };

  const { v1Chains, v1Beta1Chains } = filterV1GovChains(chains);
  log.info(
    `Fetching the latest proposals from ${JSON.stringify(
      v1Chains.map((c) => c.id)
    )} v1 gov chains` +
      ` and ${JSON.stringify(
        v1Beta1Chains.map((c) => c.id)
      )} v1beta1 gov chains`
  );
  const [v1ProposalResults, v1Beta1ProposalResults] = await Promise.all([
    Promise.allSettled(v1Chains.map((c) => fetchLatestCosmosProposalV1(c))),
    Promise.allSettled(
      v1Beta1Chains.map((c) => fetchLatestCosmosProposalV1Beta1(c))
    ),
  ]);

  const { v1Proposals, v1Beta1Proposals } = processProposalSettledPromises(
    v1ProposalResults,
    v1Beta1ProposalResults,
    rollbar
  );

  return mapChainsToProposals(
    v1Chains,
    v1Beta1Chains,
    v1Proposals,
    v1Beta1Proposals
  );
}
