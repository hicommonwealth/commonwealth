import { fromTimestamp } from '@hicommonwealth/chains';
import { logger } from '@hicommonwealth/logging';
import { DB } from '@hicommonwealth/model';
import {
  ChainBase,
  NotificationCategories,
  SupportedNetwork,
} from '@hicommonwealth/shared';
import { EventKind, coinToCoins } from '../../../shared/chain/types/cosmos';
import emitNotifications from '../../util/emitNotifications';
import { AllCosmosProposals } from './proposalFetching/types';

const log = logger(import.meta.filename);

export async function fetchCosmosNotifCommunities(models: DB) {
  const subscriptions = await models.Subscription.findAll({
    attributes: [
      [
        models.sequelize.fn('DISTINCT', models.sequelize.col('community_id')),
        'community_id',
      ],
    ],
    where: {
      category_id: 'chain-event',
    },
  });

  const result = await models.Community.findAll({
    where: {
      id: subscriptions.map((c) => c.community_id),
      base: ChainBase.CosmosSDK,
    },
    include: [
      {
        model: models.ChainNode,
        required: true,
      },
    ],
  });

  return result;
}

export async function fetchLatestNotifProposalIds(
  models: DB,
  communityIds: string[],
): Promise<Record<string, number>> {
  if (communityIds.length === 0) return {};

  const result = (await models.sequelize.query(
    `
    SELECT
    community_id, MAX(notification_data::jsonb -> 'event_data' ->> 'id') as proposal_id
    FROM "Notifications"
    WHERE category_id = 'chain-event' AND community_id IN (?)
    GROUP BY community_id;
  `,
    { raw: true, type: 'SELECT', replacements: [communityIds] },
  )) as { community_id: string; proposal_id: string }[];

  return result.reduce(
    (acc, item) => ({ ...acc, [item.community_id]: +item.proposal_id }),
    {},
  );
}

export function filterProposals(proposals: AllCosmosProposals) {
  const filteredProposals: AllCosmosProposals = {
    v1: {},
    v1Beta1: {},
  };

  const twoHoursAgo = new Date(Date.now() - 1000 * 60 * 120);
  for (const chainId in proposals.v1) {
    const chainProposals = proposals.v1[chainId];
    filteredProposals.v1[chainId] = chainProposals.filter((p) => {
      // proposal cannot be older than 2 hours
      const submitTime = new Date(p.submit_time);
      return !!submitTime && submitTime.getTime() > twoHoursAgo.getTime();
    });
  }

  for (const chainId in proposals.v1Beta1) {
    const chainProposals = proposals.v1Beta1[chainId];
    filteredProposals.v1Beta1[chainId] = chainProposals.filter((p) => {
      // proposal cannot be older than 2 hours
      const submitTime = fromTimestamp(p.submitTime);
      return !!submitTime && submitTime.getTime() > twoHoursAgo.getTime();
    });
  }

  return filteredProposals;
}

function formatProposalDates(date: string | Date): number {
  if (typeof date === 'string') {
    return new Date(date).getTime();
  } else if (date instanceof Date) {
    return date.getTime();
  } else {
    throw new Error('Invalid date format');
  }
}

export async function emitProposalNotifications(
  models: DB,
  proposals: AllCosmosProposals,
) {
  for (const chainId in proposals.v1) {
    const chainProposals = proposals.v1[chainId];
    for (const proposal of chainProposals) {
      try {
        await emitNotifications(models, {
          categoryId: NotificationCategories.ChainEvent,
          data: {
            community_id: chainId,
            network: SupportedNetwork.Cosmos,
            event_data: {
              kind: EventKind.SubmitProposal,
              id: proposal.id,
              content: {
                // TODO: multiple typeUrls for v1 proposals? - is this data even needed
                typeUrl: proposal.messages[0].type_url,
                value: proposal.messages[0].value,
              },
              submitTime: formatProposalDates(proposal.submit_time),
              depositEndTime: formatProposalDates(proposal.deposit_end_time),
              votingStartTime: formatProposalDates(proposal.voting_start_time),
              votingEndTime: formatProposalDates(proposal.voting_end_time),
              finalTallyResult: proposal.final_tally_result,
              totalDeposit: coinToCoins(proposal.total_deposit),
            },
          },
        });
      } catch (e) {
        log.error('Error emitting v1 proposal notification', e);
      }
    }
  }

  for (const chainId in proposals.v1Beta1) {
    const chainProposals = proposals.v1Beta1[chainId];
    for (const proposal of chainProposals) {
      try {
        await emitNotifications(models, {
          categoryId: NotificationCategories.ChainEvent,
          data: {
            community_id: chainId,
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
          },
        });
      } catch (e) {
        log.error('Error emitting v1beta1 proposal notification', e);
      }
    }
  }
}
