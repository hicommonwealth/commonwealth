import models from '../database';
import { ChainBase } from 'common-common/src/types';
import { COSMOS_GOV_V1_CHAIN_IDS } from '../config';
import {
  ProposalSDKType,
  ProposalStatus,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import { GovExtension, QueryClient, setupGovExtension } from '@cosmjs/stargate';
import { ChainInstance } from '../models/chain';
import { LCDQueryClient as GovV1Client } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query.lcd';
import { numberToLong } from 'common-common/src/cosmos-ts/src/codegen/helpers';
import { Proposal } from 'cosmjs-types/cosmos/gov/v1beta1/gov';

export async function generateCosmosGovNotifications() {
  // fetch chains to generate notifications for
  const chains = await fetchCosmosNotifChains();

  // fetch proposal id of the latest proposal notification for each chain
  let latestProposalIds = await fetchLatestNotifProposalIds(
    chains.map((c) => c.id)
  );
  console.log('latestProposalIds: ', latestProposalIds);

  // if a proposal id cannot be found, fetch the latest proposal id from the chain
  const missingPropIdChains = chains.filter((c) => !latestProposalIds[c.id]);
  if (missingPropIdChains.length) {
    const missingProposalIds = await fetchLatestProposalIds(
      missingPropIdChains
    );
    console.log('missingProposalIds: ', missingProposalIds);
    latestProposalIds = { ...latestProposalIds, ...missingProposalIds };
  }

  // // fetch new proposals for each chain
  // let newProposals: any = await fetchCosmosProposals(chains, latestProposalIds);
  // console.log("newProposals: ", newProposals);

  // filter proposals e.g. proposals that happened long ago, proposals that don't have full deposits, etc
  // newProposals = newProposals.filter((p) => p.submitTime);

  // emit notifications for new proposals
  // for (const proposal of newProposals) {
  //   // await emitNotification(proposal);
  // }
}

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

type AllCosmosProposals = {
  v1: { [chainId: string]: ProposalSDKType };
  v1Beta1: { [chainId: string]: Proposal };
};

async function fetchCosmosProposals(
  chains: ChainInstance[],
  latestProposalIds: Record<string, number>
): Promise<AllCosmosProposals> {
  const v1Chains = [];
  const v1Beta1Chains = [];

  chains.forEach((c) => {
    if (COSMOS_GOV_V1_CHAIN_IDS.includes(c.id)) {
      v1Chains.push(c);
    } else {
      v1Beta1Chains.push(c);
    }
  });

  const [v1Proposals, v1BetaProposals] = await Promise.all([
    Promise.all(
      v1Chains.map((c) =>
        fetchUpToLatestCosmosProposalV1(latestProposalIds[c.id], c)
      )
    ),
    Promise.all(
      v1Beta1Chains.map((c) =>
        fetchUpToLatestCosmosProposalV1Beta1(latestProposalIds[c.id], c)
      )
    ),
  ]);

  // map each proposal to its chain id
  return {
    v1: v1Proposals.reduce(
      (acc, proposals, i) => ({ ...acc, [v1Chains[i].id]: proposals }),
      {}
    ),
    v1Beta1: v1BetaProposals.reduce(
      (acc, proposals, i) => ({ ...acc, [v1Beta1Chains[i].id]: proposals }),
      {}
    ),
  };
}

async function fetchLatestProposalIds(
  chains: ChainInstance[]
): Promise<Record<string, number>> {
  const proposalPromises: Promise<any>[] = [];
  for (const chain of chains) {
    if (COSMOS_GOV_V1_CHAIN_IDS.includes(chain.id)) {
      proposalPromises.push(fetchLatestCosmosProposalV1(chain));
    } else {
      proposalPromises.push(fetchLatestCosmosProposalV1Beta1(chain));
    }
  }

  const allProposals = await Promise.all<ProposalSDKType | Proposal>(
    proposalPromises
  );
  const latestProposalIds: Record<string, number> = {};
  for (let i = 0; i < allProposals.length; i++) {
    latestProposalIds[chains[i].id] = (
      (<ProposalSDKType>allProposals[i]).id ||
      (<Proposal>allProposals[i]).proposalId
    ).toNumber();
  }

  return latestProposalIds;
}

async function fetchLatestCosmosProposalV1(
  chain: ChainInstance
): Promise<ProposalSDKType> {
  const client = await getCosmosClient<GovV1Client>(chain);
  const { proposals } = await client.proposals({
    proposalStatus: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
    depositor: '',
    voter: '',
  });
  console.log('Cosmos Gov V1 Proposals: ', proposals);
  return proposals[proposals.length - 1];
}

async function fetchUpToLatestCosmosProposalV1(
  proposalId: number,
  chain: ChainInstance
): Promise<ProposalSDKType[]> {
  const client = await getCosmosClient<GovV1Client>(chain);

  const proposals: ProposalSDKType[] = [];
  let shouldContinue = false;
  do {
    try {
      const { proposal } = await client.proposal({
        proposalId: numberToLong(proposalId),
      });
      if (proposal) {
        proposals.push(proposal);
        proposalId++;
        shouldContinue = true;
      }
    } catch (e) {
      // TODO: @Timothee - handle proposal not found error differently from other errors
    }
  } while (shouldContinue);

  return proposals;
}

function uint8ArrayToNumberBE(bytes) {
  let value = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) + bytes[i];
  }
  return value;
}

function numberToUint8ArrayBE(num, byteLength = 8) {
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

async function fetchLatestCosmosProposalV1Beta1(
  chain: ChainInstance
): Promise<Proposal> {
  const client = await getCosmosClient<GovV1Beta1ClientType>(chain);
  let nextKey, finalProposalsPage;
  do {
    const { proposals, pagination } = await client.gov.proposals(
      ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
      '',
      '',
      nextKey
    );
    finalProposalsPage = proposals;
    if (pagination) {
      if (!pagination?.total.isZero()) {
        const newNextKey = numberToUint8ArrayBE(pagination.total.toNumber());
        if (nextKey != newNextKey) {
          nextKey = numberToUint8ArrayBE(pagination.total.toNumber());
        } else {
          nextKey = numberToUint8ArrayBE(0);
        }
      } else nextKey = pagination?.nextKey;
    }
  } while (uint8ArrayToNumberBE(nextKey) > 0);

  console.log(
    'Cosmos Gov V1Beta1 Latest Proposal: ',
    finalProposalsPage[finalProposalsPage.length - 1]
  );
  return finalProposalsPage[finalProposalsPage.length - 1];
}

async function fetchUpToLatestCosmosProposalV1Beta1(
  proposalId: number,
  chain: ChainInstance
): Promise<Proposal[]> {
  const client = await getCosmosClient<GovV1Beta1ClientType>(chain);

  const proposals: Proposal[] = [];
  let shouldContinue = false;
  do {
    try {
      const { proposal } = await client.gov.proposal(proposalId);
      if (proposal) {
        proposals.push(proposal);
        proposalId++;
        shouldContinue = true;
      }
    } catch (e) {
      // TODO: @Timothee - handle proposal not found error differently from other errors
    }
  } while (shouldContinue);

  return proposals;
}

type GovV1Beta1ClientType = QueryClient & GovExtension;

type CosmosClientType = (QueryClient & GovExtension) | GovV1Client;
const CosmosClients: Record<string, CosmosClientType> = {};

async function getCosmosClient<
  CosmosClient extends GovV1Beta1ClientType | GovV1Client
>(chain: ChainInstance): Promise<CosmosClient> {
  if (CosmosClients[chain.id]) return CosmosClients[chain.id] as CosmosClient;

  if (COSMOS_GOV_V1_CHAIN_IDS.includes(chain.id)) {
    const { createLCDClient } = await import(
      'common-common/src/cosmos-ts/src/codegen/cosmos/lcd'
    );
    const result = await createLCDClient({
      restEndpoint: chain.ChainNode.alt_wallet_url,
    });

    CosmosClients[chain.id] = result.cosmos.gov.v1;
    return CosmosClients[chain.id] as CosmosClient;
  } else {
    const tm = await import('@cosmjs/tendermint-rpc');
    const tmClient = await tm.Tendermint34Client.connect(
      chain.ChainNode.url || chain.ChainNode.private_url
    );
    CosmosClients[chain.id] = QueryClient.withExtensions(
      tmClient,
      setupGovExtension
    );
    return CosmosClients[chain.id] as CosmosClient;
  }
}

if (require.main === module)
  generateCosmosGovNotifications().then(() => process.exit(0));
