import { logger } from '@hicommonwealth/core';
import { CommunityInstance } from '@hicommonwealth/model';

import { AllCosmosProposals } from './types';
import {
  filterV1GovCommunities,
  mapCommunitiesToProposals,
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
 * Fetches all proposals from the given proposal ids to the latest proposal for each community. Works for both v1 and
 * v1beta1 gov modules.
 */
export async function fetchUpToLatestCosmosProposals(
  communities: CommunityInstance[],
  latestProposalIds: Record<string, number>,
): Promise<AllCosmosProposals> {
  if (communities.length === 0) return { v1: {}, v1Beta1: {} };

  const { v1Communities, v1Beta1Communities: v1Beta1Communities } =
    filterV1GovCommunities(communities);
  log.info(
    `Fetching up to the latest proposals from ${JSON.stringify(
      v1Communities.map((c) => c.id),
    )} v1 gov communities` +
      ` and ${JSON.stringify(
        v1Beta1Communities.map((c) => c.id),
      )} v1beta1 gov communities`,
  );

  const [v1ProposalResults, v1BetaProposalResults] = await Promise.all([
    Promise.allSettled(
      v1Communities.map((c) =>
        fetchUpToLatestCosmosProposalV1(latestProposalIds[c.id] + 1, c),
      ),
    ),
    Promise.allSettled(
      v1Beta1Communities.map((c) =>
        fetchUpToLatestCosmosProposalV1Beta1(latestProposalIds[c.id] + 1, c),
      ),
    ),
  ]);

  const { v1Proposals, v1Beta1Proposals } = processProposalSettledPromises(
    v1ProposalResults,
    v1BetaProposalResults,
  );

  return mapCommunitiesToProposals(
    v1Communities,
    v1Beta1Communities,
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

  const { v1Communities, v1Beta1Communities } = await filterV1GovCommunities(
    chains,
  );
  log.info(
    `Fetching the latest proposals from ${JSON.stringify(
      v1Communities.map((c) => c.id),
    )} v1 gov chains` +
      ` and ${JSON.stringify(
        v1Beta1Communities.map((c) => c.id),
      )} v1beta1 gov chains`,
  );
  const [v1ProposalResults, v1Beta1ProposalResults] = await Promise.all([
    Promise.allSettled(
      v1Communities.map((c) => fetchLatestCosmosProposalV1(c)),
    ),
    Promise.allSettled(
      v1Beta1Communities.map((c) => fetchLatestCosmosProposalV1Beta1(c)),
    ),
  ]);

  const { v1Proposals, v1Beta1Proposals } = processProposalSettledPromises(
    v1ProposalResults,
    v1Beta1ProposalResults,
  );

  return mapCommunitiesToProposals(
    v1Communities,
    v1Beta1Communities,
    v1Proposals,
    v1Beta1Proposals,
  );
}
