import {
  fetchLatestProposals,
  fetchUpToLatestCosmosProposals,
} from './proposalFetching/allProposalFetching';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  emitProposalNotifications,
  fetchCosmosNotifChains,
  fetchLatestNotifProposalIds,
  filterProposals,
} from './util';
import models from '../../database';
import Rollbar from 'rollbar';
import { ROLLBAR_ENV, ROLLBAR_SERVER_TOKEN } from '../../config';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Entry-point to generate Cosmos proposal notifications. Uses a polling scheme to fetch created proposals.
 */
export async function generateCosmosGovNotifications(rollbar?: Rollbar) {
  // fetch chains to generate notifications for
  const chains = await fetchCosmosNotifChains(models);

  if (chains.length === 0) {
    log.info('No chains to generate notifications for.');
    return;
  }

  // fetch proposal id of the latest proposal notification for each chain
  const latestProposalIds = await fetchLatestNotifProposalIds(
    models,
    chains.map((c) => c.id)
  );
  log.info(
    `Fetched the following latest proposal ids: ${JSON.stringify(
      latestProposalIds
    )}`
  );

  // fetch new proposals for each chain
  const chainsWithPropId = chains.filter((c) => latestProposalIds[c.id]);
  if (chainsWithPropId.length > 0) {
    const newProposals: any = await fetchUpToLatestCosmosProposals(
      chainsWithPropId,
      latestProposalIds,
      rollbar
    );
    // filter proposals e.g. proposals that happened long ago, proposals that don't have full deposits, etc
    const filteredProposals = filterProposals(newProposals);
    await emitProposalNotifications(models, filteredProposals, rollbar);
  }

  // if a proposal id cannot be found, fetch the latest proposal from the chain
  const missingPropIdChains = chains.filter((c) => !latestProposalIds[c.id]);
  if (missingPropIdChains.length > 0) {
    const missingProposals = await fetchLatestProposals(
      missingPropIdChains,
      rollbar
    );
    const filteredProposals = filterProposals(missingProposals);
    await emitProposalNotifications(models, filteredProposals, rollbar);
  }
}

if (require.main === module) {
  const rollbar = new Rollbar({
    accessToken: ROLLBAR_SERVER_TOKEN,
    environment: ROLLBAR_ENV,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  generateCosmosGovNotifications(rollbar)
    .then(() => process.exit(0))
    .catch((err) => {
      log.error(err);
      rollbar.error(err);
      process.exit(1);
    });
}
