import { logger } from '@hicommonwealth/core';
import { CommunityInstance } from '../../../models/community';

import { AllCosmosProposals } from './types';
import {
  filterV1GovChains,
  mapChainsToProposals,
  processProposalSettledPromises,
} from './util';
import {
  fetchLatestCosmosProposalV1Beta1,
  fetchUpToLatestCosmosProposalV1Beta1,
} from './v1Beta1ProposalFetching';
import {
  fetchLatestCosmosProposalV1,
  fetchUpToLatestCosmosProposalV1,
} from './v1ProposalFetching';

const log = logger().getLogger(__filename);

/**
 * Fetches all proposals from the given proposal ids to the latest proposal for each chain. Works for both v1 and
 * v1beta1 gov modules.
 */
export async function fetchUpToLatestCosmosProposals(
  chains: CommunityInstance[],
  latestProposalIds: Record<string, number>,
): Promise<AllCosmosProposals> {
  if (chains.length === 0) return { v1: {}, v1Beta1: {} };

  const { v1Chains, v1Beta1Chains } = filterV1GovChains(chains);
  log.info(
    `Fetching up to the latest proposals from ${JSON.stringify(
      v1Chains.map((c) => c.id),
    )} v1 gov chain(s)` +
      ` and ${JSON.stringify(
        v1Beta1Chains.map((c) => c.id),
      )} v1beta1 gov chain(s)`,
  );

  const [v1ProposalResults, v1BetaProposalResults] = await Promise.all([
    Promise.allSettled(
      v1Chains.map((c) =>
        fetchUpToLatestCosmosProposalV1(latestProposalIds[c.id] + 1, c),
      ),
    ),
    Promise.allSettled(
      v1Beta1Chains.map((c) =>
        fetchUpToLatestCosmosProposalV1Beta1(latestProposalIds[c.id] + 1, c),
      ),
    ),
  ]);

  const { v1Proposals, v1Beta1Proposals } = processProposalSettledPromises(
    v1ProposalResults,
    v1BetaProposalResults,
  );

  return mapChainsToProposals(
    v1Chains,
    v1Beta1Chains,
    v1Proposals,
    v1Beta1Proposals,
  );
}

/**
 * Fetches the last/latest proposal for each chain. Works for both v1 and v1beta1 gov modules.
 */
export async function fetchLatestProposals(
  chains: CommunityInstance[],
): Promise<AllCosmosProposals> {
  if (chains.length === 0) return { v1: {}, v1Beta1: {} };

  const { v1Chains, v1Beta1Chains } = filterV1GovChains(chains);
  log.info(
    `Fetching the latest proposals from ${JSON.stringify(
      v1Chains.map((c) => c.id),
    )} v1 gov chains` +
      ` and ${JSON.stringify(
        v1Beta1Chains.map((c) => c.id),
      )} v1beta1 gov chains`,
  );
  const [v1ProposalResults, v1Beta1ProposalResults] = await Promise.all([
    Promise.allSettled(v1Chains.map((c) => fetchLatestCosmosProposalV1(c))),
    Promise.allSettled(
      v1Beta1Chains.map((c) => fetchLatestCosmosProposalV1Beta1(c)),
    ),
  ]);

  const { v1Proposals, v1Beta1Proposals } = processProposalSettledPromises(
    v1ProposalResults,
    v1Beta1ProposalResults,
  );

  return mapChainsToProposals(
    v1Chains,
    v1Beta1Chains,
    v1Proposals,
    v1Beta1Proposals,
  );
}
