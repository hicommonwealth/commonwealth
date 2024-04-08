import { ProposalSDKType } from '@hicommonwealth/chains';
import { CosmosGovernanceVersion } from '@hicommonwealth/core';
import { logger } from '@hicommonwealth/logging';
import { CommunityInstance } from '@hicommonwealth/model';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { AllCosmosProposals } from './types';

const log = logger(__filename);

export function uint8ArrayToNumberBE(bytes) {
  if (!bytes) return 0;

  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) + bytes[i];
  }
  return value;
}

export function numberToUint8ArrayBE(num, byteLength = 8) {
  if (num < 0) {
    throw new Error('This function only handles non-negative numbers.');
  }

  const bytes = new Uint8Array(byteLength);

  for (let i = 0; i < byteLength; i++) {
    bytes[byteLength - 1 - i] = num & 0xff;
    num >>= 8;
  }

  return bytes;
}

export async function filterV1GovCommunities(communities: CommunityInstance[]) {
  const v1Communities = [];
  const v1Beta1Communities = [];

  const promises = communities.map(async (c) => {
    const chainNode = await c.getChainNode();
    if (chainNode?.cosmos_gov_version === CosmosGovernanceVersion.v1) {
      v1Communities.push(c);
    } else {
      v1Beta1Communities.push(c);
    }
  });

  await Promise.all(promises);
  return { v1Communities, v1Beta1Communities };
}

export function mapCommunitiesToProposals(
  v1Communities: CommunityInstance[],
  v1Beta1Communities: CommunityInstance[],
  v1Proposals: ProposalSDKType[][],
  v1Beta1Proposals: Proposal[][],
): AllCosmosProposals {
  return {
    v1: v1Proposals.reduce(
      (acc, proposals, i) => ({ ...acc, [v1Communities[i].id]: proposals }),
      {},
    ),
    v1Beta1: v1Beta1Proposals.reduce(
      (acc, proposals, i) => ({
        ...acc,
        [v1Beta1Communities[i].id]: proposals,
      }),
      {},
    ),
  };
}

export function processProposalSettledPromises(
  v1ProposalResults: PromiseSettledResult<ProposalSDKType[]>[],
  v1Beta1ProposalResults: PromiseSettledResult<Proposal[]>[],
) {
  const v1Proposals: ProposalSDKType[][] = [];
  for (const result of v1ProposalResults) {
    if (result.status === 'rejected') {
      log.error('Fetching v1 proposal failed.', result.reason);
    } else {
      v1Proposals.push(result.value);
    }
  }

  const v1Beta1Proposals: Proposal[][] = [];
  for (const result of v1Beta1ProposalResults) {
    if (result.status === 'rejected') {
      log.error('Fetching v1beta1 proposal failed.', result.reason);
    } else {
      v1Beta1Proposals.push(result.value);
    }
  }

  return { v1Proposals, v1Beta1Proposals };
}
