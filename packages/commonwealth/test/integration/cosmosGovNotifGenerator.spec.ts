import { resetDatabase } from '../../server-test';
import models from '../../server/database';
import { expect } from 'chai';

import {
  emitProposalNotifications,
  fetchLatestNotifProposalIds,
  filterProposals,
} from '../../server/cosmos-gov-notifications/util';
import {
  ProposalSDKType,
  ProposalStatusSDKType,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/gov';
import {
  numberToLong,
  toTimestamp,
} from 'common-common/src/cosmos-ts/src/codegen/helpers';
import { Proposal, ProposalStatus } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  AllCosmosProposals,
  CosmosClients,
  GovV1Beta1ClientType,
} from '../../server/cosmos-gov-notifications/proposalFetching';
import {
  QueryProposalRequest,
  QueryProposalsRequest,
  QueryProposalResponseSDKType,
  QueryProposalsResponseSDKType,
} from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query';
import { LCDQueryClient as GovV1Client } from 'common-common/src/cosmos-ts/src/codegen/cosmos/gov/v1/query.lcd';
import {
  QueryProposalResponse,
  QueryProposalsResponse,
} from 'cosmjs-types/cosmos/gov/v1beta1/query';
import { GovProposalId } from '@cosmjs/stargate/build/modules/gov/queries';

async function createFakeProposalNotification(
  proposalId: string,
  chainId: string
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
  submitTimeMs: number = Date.now()
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
        new Date(submitTime.getTime() + 86400000 * 2)
      ),
      votingEndTime: toTimestamp(new Date(submitTime.getTime() + 86400000 * 3)),
      totalDeposit: [{ denom: 'random', amount: '1' }],
    };
    return proposal as GovTypeMapping[T];
  }
}

describe.only('Cosmos Governance Notification Generator', () => {
  before('Reset database', async () => {
    await resetDatabase();
  });

  describe('Utility function tests', () => {
    it('fetchLatestNotifProposalIds: should fetch the latest proposal ids', async () => {
      await createFakeProposalNotification('1', 'edgeware');
      const latestEdgewareProposal = await createFakeProposalNotification(
        '2',
        'edgeware'
      );
      await createFakeProposalNotification('1', 'ethereum');
      const latestEthereumProposal = await createFakeProposalNotification(
        '2',
        'ethereum'
      );

      const result = await fetchLatestNotifProposalIds([
        'edgeware',
        'ethereum',
      ]);
      expect(result).to.have.property('edgeware');
      expect(String(result.edgeware)).to.not.equal('1');
      expect(String(result.edgeware)).to.equal(
        latestEdgewareProposal.event_data.id
      );

      expect(result).to.have.property('ethereum');
      expect(String(result.ethereum)).to.not.equal('1');
      expect(String(result.ethereum)).to.equal(
        latestEthereumProposal.event_data.id
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

    it('emitProposalNotifications: should emit proposal notifications', async () => {
      const validKyveProposal = createFakeProposal('v1', 3);
      const validOsmosisProposal = createFakeProposal('v1Beta1', 3);
      await emitProposalNotifications({
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
    before('mock Cosmos clients', async () => {
      CosmosClients['kyve'] = {
        async proposal(
          params: QueryProposalRequest
        ): Promise<QueryProposalResponseSDKType> {
          return {} as any;
        },

        async proposals(
          params: QueryProposalsRequest
        ): Promise<QueryProposalsResponseSDKType> {
          return {} as any;
        },
      } as GovV1Client;

      CosmosClients['osmosis'] = {
        async proposals(
          proposalStatus: ProposalStatus,
          depositor: string,
          voter: string,
          paginationKey?: Uint8Array
        ): Promise<QueryProposalsResponse> {
          return {} as any;
        },

        async proposal(
          proposalId: GovProposalId
        ): Promise<QueryProposalResponse> {
          return {} as any;
        },
      } as unknown as GovV1Beta1ClientType;
    });

    it('should not generate notifications if there are no new proposals', async () => {});

    it('should not generate notifications if there are no cosmos chains', async () => {});
    it('should generate cosmos gov notifications', async () => {});
  });
});
