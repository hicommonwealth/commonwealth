/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import { GovProposalId } from '@cosmjs/stargate/build/modules/gov/queries';
import {
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
} from '@hicommonwealth/core';
import { expect } from 'chai';
import {
  ProposalSDKType,
  ProposalStatusSDKType,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import {
  QueryProposalRequest,
  QueryProposalResponseSDKType,
  QueryProposalsRequest,
  QueryProposalsResponseSDKType,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query';
import { LCDQueryClient as GovV1Client } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query.lcd';
import {
  numberToLong,
  toTimestamp,
} from 'common-common/src/cosmos-ts/src/codegen/helpers';
import { Proposal, ProposalStatus } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  QueryProposalResponse,
  QueryProposalsResponse,
} from 'cosmjs-types/cosmos/gov/v1beta1/query';
import { resetDatabase } from '../../server-test';
import models from '../../server/database';
import { generateCosmosGovNotifications } from '../../server/workers/cosmosGovNotifications/generateCosmosGovNotifications';
import { CosmosClients } from '../../server/workers/cosmosGovNotifications/proposalFetching/getCosmosClient';
import {
  AllCosmosProposals,
  GovV1Beta1ClientType,
} from '../../server/workers/cosmosGovNotifications/proposalFetching/types';
import {
  fetchLatestNotifProposalIds,
  filterProposals,
} from '../../server/workers/cosmosGovNotifications/util';

async function createFakeProposalNotification(
  proposalId: string,
  chainId: string,
): Promise<{ event_data: { id: string } }> {
  const notifData = {
    event_data: {
      id: proposalId,
    },
  };
  await models.Notification.create({
    category_id: 'chain-event',
    chain_id: chainId,
    notification_data: JSON.stringify(notifData),
  });

  return notifData;
}

type GovTypeMapping = {
  v1: ProposalSDKType;
  v1Beta1: Proposal;
};

/**
 * Creates a fake Cosmos v1 or v1beta1 governance proposal. The deposit end time is set to 1 day after the submit time,
 * the voting start time is set to 2 days after the submit time, and the voting end time is set to 3 days after the
 * submit time.
 * @param govType 'v1' or 'v1Beta1'
 * @param proposalId The id of the proposal. If not provided, 1 will be used.
 * @param submitTimeMs The submit time in milliseconds. If not provided, the current time will be used.
 */
function createFakeProposal<T extends keyof GovTypeMapping>(
  govType: T,
  proposalId: number = 1,
  submitTimeMs: number = Date.now(),
): GovTypeMapping[T] {
  const submitTime = new Date(submitTimeMs);

  if (govType === 'v1') {
    const proposal: ProposalSDKType = {
      id: numberToLong(proposalId),
      messages: [{ type_url: 'random', value: Uint8Array.from([1, 2, 3]) }],
      status: ProposalStatusSDKType.PROPOSAL_STATUS_UNSPECIFIED,
      final_tally_result: {
        yes_count: '1',
        no_count: '1',
        no_with_veto_count: '1',
        abstain_count: '1',
      },
      submit_time: submitTime,
      deposit_end_time: new Date(),
      voting_start_time: new Date(),
      voting_end_time: new Date(),
      total_deposit: [{ denom: 'random', amount: '1' }],
      metadata: 'random',
    };
    return proposal as GovTypeMapping[T];
  } else {
    const proposal: Proposal = {
      proposalId: numberToLong(proposalId),
      content: {
        typeUrl: 'random',
        value: Uint8Array.from([1, 2, 3]),
      },
      status: ProposalStatus.PROPOSAL_STATUS_UNSPECIFIED,
      finalTallyResult: {
        yes: '1',
        no: '1',
        noWithVeto: '1',
        abstain: '1',
      },
      submitTime: toTimestamp(submitTime),
      depositEndTime: toTimestamp(new Date(submitTime.getTime() + 86400000)),
      votingStartTime: toTimestamp(
        new Date(submitTime.getTime() + 86400000 * 2),
      ),
      votingEndTime: toTimestamp(new Date(submitTime.getTime() + 86400000 * 3)),
      totalDeposit: [{ denom: 'random', amount: '1' }],
    };
    return proposal as GovTypeMapping[T];
  }
}

function createMockClients(
  v1Proposals: ProposalSDKType[] = [],
  v1Beta1Proposals: Proposal[] = [],
  v1Chain: string = 'kyve',
  v1Beta1Chain: string = 'osmosis',
) {
  CosmosClients[v1Chain] = {
    async proposal(
      params: QueryProposalRequest,
    ): Promise<QueryProposalResponseSDKType> {
      return {
        proposal: v1Proposals.find((p) => p.id.eq(params.proposalId)),
      };
    },

    // voter and depositor are not available in proposal objects (?) so only matching by proposal status
    async proposals(
      params: QueryProposalsRequest,
    ): Promise<QueryProposalsResponseSDKType> {
      return {
        proposals: v1Proposals.filter(
          (p) => p.status === (params.proposalStatus as any),
        ),
      };
    },
  } as GovV1Client;

  CosmosClients[v1Beta1Chain] = {
    gov: {
      async proposal(
        proposalId: GovProposalId,
      ): Promise<QueryProposalResponse> {
        return {
          proposal: v1Beta1Proposals.find((p) =>
            p.proposalId.eq(Number(proposalId)),
          ),
        };
      },

      // voter and depositor are not available in proposal objects (?) so only matching by proposal status
      async proposals(
        proposalStatus: ProposalStatus,
        depositor?: string,
        voter?: string,
        paginationKey?: Uint8Array,
      ): Promise<QueryProposalsResponse> {
        return {
          proposals: v1Beta1Proposals.filter(
            (p) => p.status === proposalStatus,
          ),
        };
      },
    },
  } as unknown as GovV1Beta1ClientType;
}

/**
 * Creates a Cosmos ChainNode and Chain that uses v1 governance and another one that uses v1beta1 governance.
 */
export async function createCosmosChains() {
  await models.sequelize.transaction(async (transaction) => {
    const kyveNode = await models.ChainNode.create({
      url: 'https://rpc-eu-1.kyve.network/',
      alt_wallet_url: 'https://api-eu-1.kyve.network/',
      name: 'KYVE Network',
      balance_type: BalanceType.Cosmos,
    });

    const osmosisNode = await models.ChainNode.create({
      url: 'https://rpc.osmosis.zone',
      alt_wallet_url: 'https://rest.cosmos.directory/osmosis',
      name: 'Osmosis',
      balance_type: BalanceType.Cosmos,
    });

    await models.Community.create(
      {
        id: 'kyve',
        name: 'KYVE',
        network: ChainNetwork.Kyve,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: kyveNode.id,
        default_symbol: 'KYVE',
      },
      { transaction },
    );

    await models.Community.create(
      {
        id: 'osmosis',
        name: 'Osmosis',
        network: ChainNetwork.Osmosis,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        has_chain_events_listener: true,
        chain_node_id: osmosisNode.id,
        default_symbol: 'OSMO',
      },
      { transaction },
    );
  });
}

describe('Cosmos Governance Notification Generator', () => {
  before('Reset database', async () => {
    await resetDatabase();
  });

  describe('Utility function tests', () => {
    it('fetchLatestNotifProposalIds: should fetch the latest proposal ids', async () => {
      await createFakeProposalNotification('1', 'edgeware');
      const latestEdgewareProposal = await createFakeProposalNotification(
        '2',
        'edgeware',
      );
      await createFakeProposalNotification('1', 'ethereum');
      const latestEthereumProposal = await createFakeProposalNotification(
        '2',
        'ethereum',
      );

      const result = await fetchLatestNotifProposalIds(models, [
        'edgeware',
        'ethereum',
      ]);
      expect(result).to.have.property('edgeware');
      expect(String(result.edgeware)).to.not.equal('1');
      expect(String(result.edgeware)).to.equal(
        latestEdgewareProposal.event_data.id,
      );

      expect(result).to.have.property('ethereum');
      expect(String(result.ethereum)).to.not.equal('1');
      expect(String(result.ethereum)).to.equal(
        latestEthereumProposal.event_data.id,
      );
    });

    it('filterProposals: should filter out old proposals', async () => {
      const validKyveProposal = createFakeProposal('v1', 3);
      const validOsmosisProposal = createFakeProposal('v1Beta1', 3);
      const oneDayAgo = Date.now() - 60000 * 60 * 24;
      const threeHoursAgo = Date.now() - 60000 * 180;
      const allProposals: AllCosmosProposals = {
        v1: {
          kyve: [
            createFakeProposal('v1', 1, oneDayAgo),
            createFakeProposal('v1', 2, threeHoursAgo),
            validKyveProposal,
          ],
        },
        v1Beta1: {
          osmosis: [
            createFakeProposal('v1Beta1', 1, oneDayAgo),
            createFakeProposal('v1Beta1', 2, threeHoursAgo),
            validOsmosisProposal,
          ],
        },
      };
      const filteredProposals = filterProposals(allProposals);
      expect(filteredProposals).to.deep.equal({
        v1: {
          kyve: [validKyveProposal],
        },
        v1Beta1: {
          osmosis: [validOsmosisProposal],
        },
      });
    });
  });

  describe('generateCosmosGovNotifications tests', () => {
    beforeEach(
      'Reset Cosmos clients and delete chain-event notifications',
      async () => {
        for (const key in CosmosClients) {
          delete CosmosClients[key];
        }

        await models.sequelize.query(`
          DELETE FROM "NotificationsRead";
        `);
        await models.Notification.destroy({
          where: {
            category_id: 'chain-event',
          },
        });
      },
    );

    it('should not generate notifications if there are no cosmos chains', async () => {
      await models.Community.destroy({
        where: {
          base: ChainBase.CosmosSDK,
        },
      });

      createMockClients(
        [createFakeProposal('v1', 4), createFakeProposal('v1', 5)],
        [createFakeProposal('v1Beta1', 7), createFakeProposal('v1Beta1', 8)],
      );

      await generateCosmosGovNotifications();

      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });

      expect(notifications.length).to.equal(0);
    });

    it('should not generate notifications if there are no new proposals', async () => {
      await createCosmosChains();
      const user = await models.User.findOne();
      await models.Subscription.findOrCreate({
        where: {
          subscriber_id: user.id,
          chain_id: 'osmosis',
          category_id: 'chain-event',
        },
      });
      await models.Subscription.findOrCreate({
        where: {
          subscriber_id: user.id,
          chain_id: 'kyve',
          category_id: 'chain-event',
        },
      });

      createMockClients();
      await generateCosmosGovNotifications();

      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });

      expect(notifications.length).to.equal(0);
    });

    it('should generate notifications for recent proposals even if there are no existing notifications', async () => {
      createMockClients(
        [createFakeProposal('v1', 4), createFakeProposal('v1', 5)],
        [createFakeProposal('v1Beta1', 7), createFakeProposal('v1Beta1', 8)],
      );

      await generateCosmosGovNotifications();

      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });

      expect(notifications.length).to.equal(2);
    });

    it('should generate cosmos gov notifications for new proposals given existing notifications', async () => {
      const v1ExistingNotifPropId = 24;
      const v1Beta1ExistingNotifPropId = 36;
      await models.Notification.create({
        category_id: 'chain-event',
        chain_id: 'kyve',
        notification_data: JSON.stringify({
          event_data: {
            id: v1ExistingNotifPropId,
          },
        }),
      });

      await models.Notification.create({
        category_id: 'chain-event',
        chain_id: 'osmosis',
        notification_data: JSON.stringify({
          event_data: {
            id: v1Beta1ExistingNotifPropId,
          },
        }),
      });

      createMockClients(
        [createFakeProposal('v1', v1ExistingNotifPropId + 1)],
        [createFakeProposal('v1Beta1', v1Beta1ExistingNotifPropId + 1)],
      );
      await generateCosmosGovNotifications();
      const notifications = await models.Notification.findAll({
        where: {
          category_id: 'chain-event',
        },
      });
      expect(notifications.length).to.equal(4);
    });
  });
});
