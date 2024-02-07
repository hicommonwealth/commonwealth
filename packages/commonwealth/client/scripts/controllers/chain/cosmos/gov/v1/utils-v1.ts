import {
  ProposalSDKType,
  ProposalStatus,
  TallyResultSDKType,
} from '@hicommonwealth/chains';
import BN from 'bn.js';
import moment from 'moment';
import type { LCD } from '../../../../../../../shared/chain/types/cosmos';
import type {
  CosmosProposalState,
  ICosmosProposal,
  ICosmosProposalTally,
} from '../../types';
import { isCompleted } from '../v1beta1/utils-v1beta1';

/* Governance helper methods for Cosmos chains with gov module v1 (as of Cosmos SDK v0.46.11) */

export const fetchProposalsByStatusV1 = async (
  lcd: LCD,
  status: ProposalStatus,
): Promise<ProposalSDKType[]> => {
  try {
    const { proposals: proposalsByStatus, pagination } =
      await lcd.cosmos.gov.v1.proposals({
        proposalStatus: status,
        voter: '',
        depositor: '',
      });

    let nextKey = pagination?.next_key;
    while (nextKey?.length > 0) {
      // console.log(nextKey);
      const { proposals, pagination: nextPage } =
        await lcd.cosmos.gov.v1.proposals({
          proposalStatus: status,
          voter: '',
          depositor: '',
          pagination: {
            key: nextKey,
            limit: null,
            offset: null,
            countTotal: true,
            reverse: true,
          },
        });
      proposalsByStatus.push(...proposals);
      nextKey = nextPage.next_key;
    }
    return proposalsByStatus;
  } catch (e) {
    console.error(`Error fetching proposal by status ${status}`, e);
    return [];
  }
};

export const getActiveProposalsV1 = async (
  lcd: LCD,
): Promise<ICosmosProposal[]> => {
  const votingPeriodProposals = await fetchProposalsByStatusV1(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
  );
  const depositPeriodProposals = await fetchProposalsByStatusV1(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD,
  );
  return sortProposalsV1([...votingPeriodProposals, ...depositPeriodProposals]);
};

export const getCompletedProposalsV1 = async (
  lcd: LCD,
): Promise<ICosmosProposal[]> => {
  const passedProposals = await fetchProposalsByStatusV1(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_PASSED,
  );
  const failedProposals = await fetchProposalsByStatusV1(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_FAILED,
  );
  const rejectedProposals = await fetchProposalsByStatusV1(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_REJECTED,
  );
  const combined = [
    ...passedProposals,
    ...failedProposals,
    ...rejectedProposals,
  ];
  return sortProposalsV1(combined);
};

export const sortProposalsV1 = (
  proposals: ProposalSDKType[],
): ICosmosProposal[] => {
  return proposals
    .map((p) => propToIProposal(p))
    .filter((p) => !!p)
    .sort((p1, p2) => +p2.identifier - +p1.identifier);
};

export const propToIProposal = (p: ProposalSDKType): ICosmosProposal | null => {
  const status = stateEnumToStringV1(p.status.toString());
  const identifier = p.id.toString();
  let title = '';
  let description = '';
  let messages = [];
  if (p.messages?.length > 0) {
    messages = p.messages.map((m) => {
      const content = m['content'];
      // get title and description from 1st message if no top-level title/desc
      if (!title) title = content?.title;
      if (!description) description = content?.description;
      return m;
    });
  }

  return {
    identifier,
    type: 'text',
    title,
    description,
    messages,
    metadata: p.metadata,
    submitTime: moment.unix(new Date(p.submit_time).valueOf() / 1000),
    depositEndTime: moment.unix(new Date(p.deposit_end_time).valueOf() / 1000),
    votingEndTime: moment.unix(new Date(p.voting_end_time).valueOf() / 1000),
    votingStartTime: moment.unix(
      new Date(p.voting_start_time).valueOf() / 1000,
    ),
    proposer: null,
    state: {
      identifier,
      completed: isCompleted(status),
      status,
      // TODO: handle non-default amount
      totalDeposit:
        p.total_deposit && p.total_deposit[0]
          ? new BN(p.total_deposit[0].amount)
          : new BN(0),
      depositors: [],
      voters: [],
      tally: p.final_tally_result && marshalTallyV1(p.final_tally_result),
    },
  };
};

const stateEnumToStringV1 = (status: string): CosmosProposalState => {
  switch (status) {
    case 'PROPOSAL_STATUS_UNSPECIFIED':
      return 'Unspecified';
    case 'PROPOSAL_STATUS_DEPOSIT_PERIOD':
      return 'DepositPeriod';
    case 'PROPOSAL_STATUS_VOTING_PERIOD':
      return 'VotingPeriod';
    case 'PROPOSAL_STATUS_PASSED':
      return 'Passed';
    case 'PROPOSAL_STATUS_FAILED':
      return 'Failed';
    case 'PROPOSAL_STATUS_REJECTED':
      return 'Rejected';
    case 'UNRECOGNIZED':
      return 'Unrecognized';
    default:
      throw new Error(`Invalid proposal state: ${status}`);
  }
};

export const marshalTallyV1 = (
  tally: TallyResultSDKType,
): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: new BN(tally.yes_count),
    abstain: new BN(tally.abstain_count),
    no: new BN(tally.no_count),
    noWithVeto: new BN(tally.no_with_veto_count),
  };
};
