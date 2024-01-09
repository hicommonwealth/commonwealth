import { ProposalStatus } from '@hicommonwealth/chains';
import { factory, formatFilename } from 'common-common/src/logging';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { CommunityInstance } from '../../../models/community';
import { getCosmosClient } from './getCosmosClient';
import { GovV1Beta1ClientType } from './types';
import { numberToUint8ArrayBE, uint8ArrayToNumberBE } from './util';

const log = factory.getLogger(formatFilename(__filename));

/**
 * See {@Link fetchLatestCosmosProposalV1}. Same logic applies, but for Cosmos chains that use the v1beta1 gov module.
 * @param chain
 */
export async function fetchLatestCosmosProposalV1Beta1(
  chain: CommunityInstance,
): Promise<Proposal[]> {
  const client = await getCosmosClient<GovV1Beta1ClientType>(chain);
  let nextKey: Uint8Array, finalProposalsPage: Proposal[];
  do {
    const result = await client.gov.proposals(
      ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
      '',
      '',
      nextKey,
    );
    if (!result) {
      console.error(`Result is undefined for ${chain.id}`);
    }
    finalProposalsPage = result?.proposals;
    if (result?.pagination) {
      if (!result.pagination?.total.isZero()) {
        const newNextKey = numberToUint8ArrayBE(
          result.pagination.total.toNumber(),
        );
        if (nextKey != newNextKey) {
          nextKey = newNextKey;
        } else {
          nextKey = numberToUint8ArrayBE(0);
        }
      } else nextKey = result.pagination?.nextKey;
    }
  } while (uint8ArrayToNumberBE(nextKey) > 0);

  if (finalProposalsPage.length > 0) {
    log.info(
      `Fetched proposal ${finalProposalsPage[
        finalProposalsPage.length - 1
      ].proposalId.toNumber()} from ${chain.id}`,
    );
    return [finalProposalsPage[finalProposalsPage.length - 1]];
  } else return [];
}

/**
 * See {@Link fetchUpToLatestCosmosProposalV1}. Same logic applies, but for Cosmos chains that use the
 * v1beta1 gov module.
 */
export async function fetchUpToLatestCosmosProposalV1Beta1(
  proposalId: number,
  chain: CommunityInstance,
): Promise<Proposal[]> {
  log.info(
    `Fetching proposals from '${chain.id}' starting at proposal id ${proposalId}`,
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
