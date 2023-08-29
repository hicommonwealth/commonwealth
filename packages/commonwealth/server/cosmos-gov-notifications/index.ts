import models from '../database';
import { ChainBase } from 'common-common/src/types';
import {
  fetchUpToLatestCosmosProposals,
  fetchLatestProposals,
  AllCosmosProposals,
} from './proposalFetching';
import emitNotifications from '../util/emitNotifications';
import { NotificationCategories } from 'common-common/src/types';
import { coinToCoins, EventKind } from 'chain-events/src/chains/cosmos/types';
import { SupportedNetwork } from 'chain-events/src';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

async function fetchCosmosNotifChains() {
  return await models.Chain.findAll({
    where: {
      base: ChainBase.CosmosSDK,
      has_chain_events_listener: true,
    },
    include: [
      {
        model: models.ChainNode,
        required: true,
      },
    ],
  });
}

export async function fetchLatestNotifProposalIds(
  chainIds: string[]
): Promise<Record<string, number>> {
  const result = (await models.sequelize.query(
    `
    SELECT
    chain_id, MAX(notification_data::jsonb -> 'event_data' ->> 'id') as proposal_id
    FROM "Notifications"
    WHERE category_id = 'chain-event' AND chain_id IN (?)
    GROUP BY chain_id;
  `,
    { raw: true, type: 'SELECT', replacements: [chainIds] }
  )) as { chain_id: string; proposal_id: string }[];

  return result.reduce(
    (acc, item) => ({ ...acc, [item.chain_id]: +item.proposal_id }),
    {}
  );
}

function filterProposals(proposals: AllCosmosProposals) {
  const filteredProposals: AllCosmosProposals = {
    v1: {},
    v1Beta1: {},
  };

  for (const chainId in proposals.v1) {
    const chainProposals = proposals.v1[chainId];
    const filteredProposalsForChain = chainProposals.filter((p) => {
      // proposal cannot be older than 2 hours
      return (
        p.submit_time && p.submit_time.getTime() > Date.now() - 1000 * 60 * 120
      );
    });

    filteredProposals.v1[chainId] = filteredProposalsForChain;
  }

  for (const chainId in proposals.v1Beta1) {
    const chainProposals = proposals.v1Beta1[chainId];
    const filteredProposalsForChain = chainProposals.filter((p) => {
      // proposal cannot be older than 2 hours
      return (
        p.submitTime &&
        p.submitTime.seconds.toNumber() > Date.now() / 1000 - 1000 * 60 * 120
      );
    });

    filteredProposals.v1Beta1[chainId] = filteredProposalsForChain;
  }

  return filteredProposals;
}

async function emitProposalNotifications(proposals: AllCosmosProposals) {
  for (const chainId in proposals.v1) {
    const chainProposals = proposals.v1[chainId];
    for (const proposal of chainProposals) {
      await emitNotifications(
        models,
        NotificationCategories.ChainEvent,
        chainId,
        {
          // TODO: remove need for an id, block number, and queued
          id: 1,
          block_number: 1,
          queued: 1,
          chain: chainId,
          network: SupportedNetwork.Cosmos,
          event_data: {
            kind: EventKind.SubmitProposal,
            id: proposal.id.toString(10),
            content: {
              // TODO: multiple typeUrls for v1 proposals? - is this data even needed
              typeUrl: proposal.messages[0].type_url,
              value: Buffer.from(proposal.messages[0].value).toString('hex'),
            },
            submitTime: Math.round(proposal.submit_time.getTime() / 1000),
            depositEndTime: Math.round(
              proposal.deposit_end_time.getTime() / 1000
            ),
            votingStartTime: Math.round(
              proposal.voting_start_time.getTime() / 1000
            ),
            votingEndTime: Math.round(proposal.voting_end_time.getTime()),
            finalTallyResult: proposal.final_tally_result,
            totalDeposit: coinToCoins(proposal.total_deposit),
          },
        }
      );
    }
  }

  for (const chainId in proposals.v1Beta1) {
    const chainProposals = proposals.v1Beta1[chainId];
    for (const proposal of chainProposals) {
      await emitNotifications(
        models,
        NotificationCategories.ChainEvent,
        chainId,
        {
          // TODO: remove need for an id, block number, and queued
          id: 1,
          block_number: 1,
          queued: 1,
          chain: chainId,
          network: SupportedNetwork.Cosmos,
          event_data: {
            kind: EventKind.SubmitProposal,
            id: proposal.proposalId.toString(10),
            content: {
              // TODO: multiple typeUrls for v1 proposals? - is this data even needed
              typeUrl: proposal.content.typeUrl,
              value: Buffer.from(proposal.content.value).toString('hex'),
            },
            submitTime: proposal.submitTime.seconds.toNumber(),
            depositEndTime: proposal.depositEndTime.seconds.toNumber(),
            votingStartTime: proposal.votingStartTime.seconds.toNumber(),
            votingEndTime: proposal.votingEndTime.seconds.toNumber(),
            finalTallyResult: proposal.finalTallyResult,
            totalDeposit: coinToCoins(proposal.totalDeposit),
          },
        }
      );
    }
  }
}

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
