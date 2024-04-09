import { logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'node:url';
import {
  fetchLatestProposals,
  fetchUpToLatestCosmosProposals,
} from './proposalFetching/allProposalFetching';
import {
  emitProposalNotifications,
  fetchCosmosNotifCommunities,
  fetchLatestNotifProposalIds,
  filterProposals,
} from './util';

const __filename = fileURLToPath(import.meta.url);
const log = logger().getLogger(__filename);

/**
 * Entry-point to generate Cosmos proposal notifications. Uses a polling scheme to fetch created proposals.
 */
export async function generateCosmosGovNotifications() {
  // fetch communities to generate notifications for
  const communities = await fetchCosmosNotifCommunities(models);

  if (communities.length === 0) {
    log.info('No communities to generate notifications for.');
    return;
  }

  // fetch proposal id of the latest proposal notification for each community
  const latestProposalIds = await fetchLatestNotifProposalIds(
    models,
    communities.map((c) => c.id),
  );
  log.info(
    `Fetched the following latest proposal ids: ${JSON.stringify(
      latestProposalIds,
    )}`,
  );

  // fetch new proposals for each community
  const communitiesWithPropId = communities.filter(
    (c) => latestProposalIds[c.id],
  );
  if (communitiesWithPropId.length > 0) {
    const newProposals: any = await fetchUpToLatestCosmosProposals(
      communitiesWithPropId,
      latestProposalIds,
    );
    // filter proposals e.g. proposals that happened long ago, proposals that don't have full deposits, etc
    const filteredProposals = filterProposals(newProposals);
    await emitProposalNotifications(models, filteredProposals);
  }

  // if a proposal id cannot be found, fetch the latest proposal from the community
  const missingPropIdCommunities = communities.filter(
    (c) => !latestProposalIds[c.id],
  );
  if (missingPropIdCommunities.length > 0) {
    const missingProposals = await fetchLatestProposals(
      missingPropIdCommunities,
    );
    const filteredProposals = filterProposals(missingProposals);
    await emitProposalNotifications(models, filteredProposals);
  }
}

if (require.main === module) {
  generateCosmosGovNotifications()
    .then(() => process.exit(0))
    .catch((err) => {
      log.error(err);
      process.exit(1);
    });
}
