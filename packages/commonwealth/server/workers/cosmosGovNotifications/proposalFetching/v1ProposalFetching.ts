import { PageRequest } from 'common-common/src/cosmos-ts/src/codegen/cosmos/base/query/v1beta1/pagination';
import {
  ProposalSDKType,
  ProposalStatus,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { LCDQueryClient as GovV1Client } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query.lcd';
import { numberToLong } from 'common-common/src/cosmos-ts/src/codegen/helpers';
import { factory, formatFilename } from 'common-common/src/logging';
import { CommunityInstance } from '../../../models/community';
import { getCosmosClient } from './getCosmosClient';
import { numberToUint8ArrayBE, uint8ArrayToNumberBE } from './util';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Fetches the most recent (latest) proposal from a Cosmos chain that uses the v1 gov module. Depending on the
 * Cosmos SDK version the chain is built with, the fetching can be optimized by using varying pagination values.
 * See /gov/v1beta1/proposals at https://v1.cosmos.network/rpc/v0.45.1 for more details on pagination values.
 */
export async function fetchLatestCosmosProposalV1(
  chain: CommunityInstance,
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
      } from ${chain.id}`,
    );
    return [finalProposalsPage[finalProposalsPage.length - 1]];
  } else return [];
}

/**
 * Attempts to fetch the proposal at the given proposalId from a Cosmos chain that uses the v1 gov module. If a proposal
 * with the given id exists, the function attempts to fetch the next proposal. This process repeats until no proposal
 * is found at which time all the fetched proposals are returned.
 */
export async function fetchUpToLatestCosmosProposalV1(
  proposalId: number,
  chain: CommunityInstance,
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
      if (!e.message.includes('Request failed with status code 404')) {
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
