import {
  ProposalSDKType,
  ProposalStatus,
  TallyResultSDKType,
} from '@atomone/atomone-types-long/atomone/gov/v1/gov';
import BN from 'bn.js';
import moment from 'moment';
import type { AtomOneLCD } from '../../../../../../../shared/chain/types/cosmos';
import type {
  CosmosProposalState,
  ICosmosProposal,
  ICosmosProposalTally,
} from '../../types';

import { EncodeObject } from '@cosmjs/proto-signing';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import { Any } from 'cosmjs-types/google/protobuf/any';
import { isCompleted } from '../v1beta1/utils-v1beta1';

/* Governance helper methods for Cosmos chains with gov module v1 (as of Cosmos SDK v0.46.11) */

export const fetchProposalsByStatusV1AtomOne = async (
  lcd: AtomOneLCD,
  status: ProposalStatus,
): Promise<ProposalSDKType[]> => {
  try {
    const { proposals: proposalsByStatus, pagination } =
      await lcd.atomone.gov.v1.proposals({
        proposalStatus: status,
        voter: '',
        depositor: '',
      });

    let nextKey = pagination?.next_key;

    // @ts-expect-error StrictNullChecks
    while (nextKey?.length > 0) {
      // TODO: temp fix to handle chains that return nextKey as a string instead of Uint8Array
      // Our v1 API needs to handle this better. To be addressed in #6610
      if (typeof nextKey === 'string') {
        nextKey = new Uint8Array(Buffer.from(nextKey, 'base64'));
      }

      const { proposals, pagination: nextPage } =
        await lcd.atomone.gov.v1.proposals({
          proposalStatus: status,
          voter: '',
          depositor: '',
          pagination: {
            // @ts-expect-error StrictNullChecks
            key: nextKey,
            // @ts-expect-error StrictNullChecks
            limit: undefined,
            // @ts-expect-error StrictNullChecks
            offset: undefined,
            countTotal: true,
            reverse: true,
          },
        });
      proposalsByStatus.push(...proposals);
      // @ts-expect-error StrictNullChecks
      nextKey = nextPage.next_key;
    }
    return proposalsByStatus;
  } catch (e) {
    console.error(`Error fetching proposal by status ${status}`, e);
    return [];
  }
};

export const getActiveProposalsV1AtomOne = async (
  lcd: AtomOneLCD,
): Promise<ICosmosProposal[]> => {
  const votingPeriodProposals = await fetchProposalsByStatusV1AtomOne(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
  );
  const depositPeriodProposals = await fetchProposalsByStatusV1AtomOne(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD,
  );
  return sortProposalsV1AtomOne([
    ...votingPeriodProposals,
    ...depositPeriodProposals,
  ]);
};

export const getCompletedProposalsV1AtomOne = async (
  lcd: AtomOneLCD,
): Promise<ICosmosProposal[]> => {
  const passedProposals = await fetchProposalsByStatusV1AtomOne(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_PASSED,
  );
  const failedProposals = await fetchProposalsByStatusV1AtomOne(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_FAILED,
  );
  const rejectedProposals = await fetchProposalsByStatusV1AtomOne(
    lcd,
    ProposalStatus.PROPOSAL_STATUS_REJECTED,
  );
  const combined = [
    ...passedProposals,
    ...failedProposals,
    ...rejectedProposals,
  ];
  return sortProposalsV1AtomOne(combined);
};

export const sortProposalsV1AtomOne = (
  proposals: ProposalSDKType[],
): ICosmosProposal[] => {
  return proposals
    .map((p) => propToIProposal(p))
    .filter((p): p is ICosmosProposal => !!p)
    .sort((p1, p2) => +p2!.identifier - +p1!.identifier);
};

export const propToIProposal = (p: ProposalSDKType): ICosmosProposal | null => {
  const status = stateEnumToStringV1(p.status.toString());
  const identifier = p.id.toString();
  let title = '';
  let description = '';
  let messages = [];
  if (p.messages?.length > 0) {
    // @ts-expect-error StrictNullChecks
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
    // @ts-expect-error StrictNullChecks
    submitTime: moment.unix(new Date(p.submit_time).valueOf() / 1000),
    // @ts-expect-error StrictNullChecks
    depositEndTime: moment.unix(new Date(p.deposit_end_time).valueOf() / 1000),
    // @ts-expect-error StrictNullChecks
    votingEndTime: moment.unix(new Date(p.voting_end_time).valueOf() / 1000),
    votingStartTime: moment.unix(
      // @ts-expect-error StrictNullChecks
      new Date(p.voting_start_time).valueOf() / 1000,
    ),
    // @ts-expect-error StrictNullChecks
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
      // @ts-expect-error StrictNullChecks
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
  // @ts-expect-error StrictNullChecks
  if (!tally) return null;
  return {
    yes: new BN(tally.yes_count),
    abstain: new BN(tally.abstain_count),
    no: new BN(tally.no_count),
    noWithVeto: new BN(0),
  };
};

export const encodeMsgSubmitProposalAtomOne = (
  sender: string,
  initialDeposit: CosmosToken,
  content: Any,
): EncodeObject => {
  return {
    typeUrl: '/atomone.gov.v1beta1.MsgSubmitProposal',
    value: {
      initialDeposit: [initialDeposit.toCoinObject()],
      proposer: sender,
      content,
    },
  };
};
