import { ChainInstance } from '../models/chain';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../config';
import { ProposalSDKType } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { AllCosmosProposals } from './proposalFetching';
import { ChainBase, NotificationCategories } from 'common-common/src/types';
import emitNotifications from '../util/emitNotifications';
import { SupportedNetwork } from 'chain-events/src';
import { coinToCoins, EventKind } from 'chain-events/src/chains/cosmos/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { fromTimestamp } from 'common-common/src/cosmos-ts/src/codegen/helpers';
import { DB } from '../models';
import Rollbar from 'rollbar';

const log = factory.getLogger(formatFilename(__filename));

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

export function filterV1GovChains(chains: ChainInstance[]) {
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
  v1Chains: ChainInstance[],
  v1Beta1Chains: ChainInstance[],
  v1Proposals: ProposalSDKType[][],
  v1Beta1Proposals: Proposal[][]
): AllCosmosProposals {
  return {
    v1: v1Proposals.reduce(
      (acc, proposals, i) => ({ ...acc, [v1Chains[i].id]: proposals }),
      {}
    ),
    v1Beta1: v1Beta1Proposals.reduce(
      (acc, proposals, i) => ({ ...acc, [v1Beta1Chains[i].id]: proposals }),
      {}
    ),
  };
}

export function processProposalSettledPromises(
  v1ProposalResults: PromiseSettledResult<ProposalSDKType[]>[],
  v1Beta1ProposalResults: PromiseSettledResult<Proposal[]>[],
  rollbar?: Rollbar
) {
  const v1Proposals: ProposalSDKType[][] = [];
  for (const result of v1ProposalResults) {
    if (result.status === 'rejected') {
      log.error(result.reason);
      rollbar?.error(result.reason);
    } else {
      v1Proposals.push(result.value);
    }
  }

  const v1Beta1Proposals: Proposal[][] = [];
  for (const result of v1Beta1ProposalResults) {
    if (result.status === 'rejected') {
      log.error(result.reason);
      rollbar?.error(result.reason);
    } else {
      v1Beta1Proposals.push(result.value);
    }
  }

  return { v1Proposals, v1Beta1Proposals };
}

export async function fetchCosmosNotifChains(models: DB) {
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
  models: DB,
  chainIds: string[]
): Promise<Record<string, number>> {
  if (chainIds.length === 0) return {};

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
  rollbar?: Rollbar
) {
  for (const chainId in proposals.v1) {
    const chainProposals = proposals.v1[chainId];
    for (const proposal of chainProposals) {
      try {
        await emitNotifications(models, {
          categoryId: NotificationCategories.ChainEvent,
          data: {
            chain: chainId,
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
        log.error(e);
        rollbar?.error(e);
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
          },
        });
      } catch (e) {
        log.error(e);
        rollbar?.error(e);
      }
    }
  }
}
