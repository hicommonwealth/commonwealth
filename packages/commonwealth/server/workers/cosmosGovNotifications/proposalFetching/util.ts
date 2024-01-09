import { formatFilename, loggerFactory } from '@hicommonwealth/adapters';
import { ProposalSDKType } from '@hicommonwealth/chains';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../../../config';
import { CommunityInstance } from '../../../models/community';
import { rollbar } from '../../../util/rollbar';
import { AllCosmosProposals } from './types';

const log = loggerFactory.getLogger(formatFilename(__filename));

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

export function filterV1GovChains(chains: CommunityInstance[]) {
  const v1Chains = [];
  const v1Beta1Chains = [];

  chains.forEach((c) => {
    if (COSMOS_GOV_V1_CHAIN_IDS.includes(c.id)) {
      v1Chains.push(c);
    } else {
      v1Beta1Chains.push(c);
    }
  });

  return { v1Chains, v1Beta1Chains };
}

export function mapChainsToProposals(
  v1Chains: CommunityInstance[],
  v1Beta1Chains: CommunityInstance[],
  v1Proposals: ProposalSDKType[][],
  v1Beta1Proposals: Proposal[][],
): AllCosmosProposals {
  return {
    v1: v1Proposals.reduce(
      (acc, proposals, i) => ({ ...acc, [v1Chains[i].id]: proposals }),
      {},
    ),
    v1Beta1: v1Beta1Proposals.reduce(
      (acc, proposals, i) => ({ ...acc, [v1Beta1Chains[i].id]: proposals }),
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
      rollbar?.error('Fetching v1 proposal failed.', result.reason);
    } else {
      v1Proposals.push(result.value);
    }
  }

  const v1Beta1Proposals: Proposal[][] = [];
  for (const result of v1Beta1ProposalResults) {
    if (result.status === 'rejected') {
      log.error('Fetching v1beta1 proposal failed.', result.reason);
      rollbar?.error('Fetching v1beta1 proposal failed.', result.reason);
    } else {
      v1Beta1Proposals.push(result.value);
    }
  }

  return { v1Proposals, v1Beta1Proposals };
}
