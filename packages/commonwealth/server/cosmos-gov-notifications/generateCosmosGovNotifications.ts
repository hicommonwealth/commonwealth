import {
  fetchLatestProposals,
  fetchUpToLatestCosmosProposals,
} from './proposalFetching';
import { factory, formatFilename } from 'common-common/src/logging';
import {
  emitProposalNotifications,
  fetchCosmosNotifChains,
  fetchLatestNotifProposalIds,
  filterProposals,
} from './util';

const log = factory.getLogger(formatFilename(__filename));

export async function generateCosmosGovNotifications() {
  // fetch chains to generate notifications for
  const chains = await fetchCosmosNotifChains();

  // fetch proposal id of the latest proposal notification for each chain
  const latestProposalIds = await fetchLatestNotifProposalIds(
    chains.map((c) => c.id)
  );
  log.info(
    `Fetched the following latest proposal ids: ${JSON.stringify(
      latestProposalIds
    )}`
  );

  // fetch new proposals for each chain
  const chainsWithPropId = chains.filter((c) => latestProposalIds[c.id]);
  let newProposals: any = await fetchUpToLatestCosmosProposals(
    chainsWithPropId,
    latestProposalIds
  );

  // if a proposal id cannot be found, fetch the latest proposal from the chain
  const missingPropIdChains = chains.filter((c) => !latestProposalIds[c.id]);
  if (missingPropIdChains.length > 0) {
    const missingProposals = await fetchLatestProposals(missingPropIdChains);
    const filteredProposals = filterProposals(missingProposals);
    await emitProposalNotifications(filteredProposals);
  }

  // filter proposals e.g. proposals that happened long ago, proposals that don't have full deposits, etc
  const filteredProposals = filterProposals(newProposals);
  await emitProposalNotifications(filteredProposals);
}

if (require.main === module)
  generateCosmosGovNotifications().then(() => process.exit(0));
