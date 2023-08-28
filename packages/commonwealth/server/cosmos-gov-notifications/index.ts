import models from '../database';
import { ChainBase } from 'common-common/src/types';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../config';

export enum CosmosGovernanceVersion {
  V1 = 'v1',
  V1BETA1 = 'v1beta1',
}

export type CosmosGovernanceVersionType = keyof typeof CosmosGovernanceVersion;

export async function generateCosmosGovNotifications() {
  // fetch chains to generate notifications for
  const chains = await fetchCosmosNotifChains();

  // fetch proposal id of the latest proposal notification for each chain
  const latestProposalIds = await fetchLatestCosmosNotifProposalIds(
    chains.map((c) => c.id)
  );

  // fetch proposals for each chain
  const newProposals: any = await fetchCosmosProposals(
    chains.map((c) => c.id),
    latestProposalIds
  );

  // emit notifications for new proposals
  for (const proposal of newProposals) {
    // await emitNotification(proposal);
  }
}

async function fetchCosmosNotifChains() {
  return await models.Chain.findAll({
    where: {
      base: ChainBase.CosmosSDK,
      has_chain_events_listener: true,
    },
  });
}

async function fetchLatestCosmosNotifProposalIds(
  chainIds: string[]
): Promise<any> {
  // return await models.Notification.findAll({
  //   where: {
  //     chain_id: chainIds,
  //   },
  //   order: [['proposal_id', 'DESC']],
  //   group: ['chain_id'],
  // });
}

async function fetchCosmosProposals(
  chainIds: string[],
  latestProposalIds: number[]
) {
  for (const chainId of chainIds) {
    if (COSMOS_GOV_V1_CHAIN_IDS.includes(chainId)) {
      return await fetchCosmosProposalsV1();
    } else {
      return await fetchCosmosProposalsV1Beta1();
    }
  }
}

async function fetchCosmosProposalsV1() {}
async function fetchCosmosProposalsV1Beta1() {}
