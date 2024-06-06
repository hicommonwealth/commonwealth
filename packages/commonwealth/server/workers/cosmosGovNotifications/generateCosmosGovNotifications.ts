import { HotShotsStats } from '@hicommonwealth/adapters';
import { dispose, logger, stats } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { fileURLToPath } from 'url';
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
const log = logger(__filename);

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
    // @ts-expect-error StrictNullChecks
    communities.map((c) => c.id),
  );
  log.info(
    `Fetched the following latest proposal ids: ${JSON.stringify(
      latestProposalIds,
    )}`,
  );

  // fetch new proposals for each community
  const communitiesWithPropId = communities.filter(
    // @ts-expect-error StrictNullChecks
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
    // @ts-expect-error StrictNullChecks
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

if (import.meta.url.endsWith(process.argv[1])) {
  generateCosmosGovNotifications()
    .then(() => {
      stats(HotShotsStats()).increment('cw.scheduler.send-cosmos-notifs');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      log.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
