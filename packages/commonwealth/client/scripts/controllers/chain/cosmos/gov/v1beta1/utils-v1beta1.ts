import BN from 'bn.js';
import { CommunityPoolSpendProposal } from 'cosmjs-types/cosmos/distribution/v1beta1/distribution';
import type {
  Proposal,
  TallyResult,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  ProposalStatus,
  TextProposal,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import moment from 'moment';

import {
  MsgSubmitProposalEncodeObject,
  MsgVoteEncodeObject,
} from '@cosmjs/stargate';
import { longify } from '@cosmjs/stargate/build/queryclient';
import { Any } from 'cosmjs-types/google/protobuf/any';

import type {
  CoinObject,
  CosmosProposalState,
  CosmosProposalType,
  ICosmosProposal,
  ICosmosProposalTally,
} from 'controllers/chain/cosmos/types';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import Long from 'long';
import Cosmos from '../../adapter';
import { CosmosApiType } from '../../chain';
import CosmosGovernance from './governance-v1beta1';

/* -- v1beta1-specific methods: -- */

export const stateEnumToString = (
  status: ProposalStatus,
): CosmosProposalState => {
  switch (status) {
    case ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD:
      return 'DepositPeriod';
    case ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD:
      return 'VotingPeriod';
    case ProposalStatus.PROPOSAL_STATUS_PASSED:
      return 'Passed';
    case ProposalStatus.PROPOSAL_STATUS_FAILED:
      return 'Failed';
    case ProposalStatus.PROPOSAL_STATUS_REJECTED:
      return 'Rejected';
    default:
      throw new Error(`Invalid proposal state: ${status}`);
  }
};

export const asciiLiteralToDecimal = async (n: Uint8Array) => {
  // 500000000000000000 = 0.5
  // dividing by 1000000000000000 gives 3 decimal digits of precision
  const cosm = await import('@cosmjs/encoding');
  const nStr = cosm.fromAscii(n);
  return +new BN(nStr).div(new BN('1000000000000000')) / 1000;
};

// todo
export const marshalTally = (tally: TallyResult): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: new BN(tally.yes),
    abstain: new BN(tally.abstain),
    no: new BN(tally.no),
    noWithVeto: new BN(tally.noWithVeto),
  };
};

const fetchProposalsByStatus = async (
  api: CosmosApiType,
  status: ProposalStatus,
): Promise<Proposal[]> => {
  if (!api?.gov) {
    console.error('API not initialized');
    return [];
  }

  try {
    const { proposals: proposalsByStatus, pagination } =
      await api.gov.proposals(status, '', '');

    let nextKey = pagination?.nextKey;
    while (nextKey.length > 0) {
      // console.log(nextKey);
      const { proposals, pagination: nextPage } = await api.gov.proposals(
        status,
        '',
        '',
        nextKey,
      );
      proposalsByStatus.push(...proposals);
      nextKey = nextPage.nextKey;
    }
    return proposalsByStatus;
  } catch (e) {
    // Since these are combined requests, we opt to fail silently and
    // return an empty array instead of throwing an error. This way, we can
    // still display the proposals that were successfully fetched.
    // If an error message is preferred, throw here instead of returning [].
    console.error(
      `Error fetching proposals by status ${ProposalStatus[status]}`,
      e,
    );
    return [];
  }
};

export const getActiveProposalsV1Beta1 = async (
  api: CosmosApiType,
): Promise<ICosmosProposal[]> => {
  const votingPeriodProposals = await fetchProposalsByStatus(
    api,
    ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
  );
  const depositPeriodProposals = await fetchProposalsByStatus(
    api,
    ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD,
  );
  return sortProposals([...votingPeriodProposals, ...depositPeriodProposals]);
};

export const getCompletedProposalsV1Beta1 = async (
  api: CosmosApiType,
): Promise<ICosmosProposal[]> => {
  const passedProposals = await fetchProposalsByStatus(
    api,
    ProposalStatus.PROPOSAL_STATUS_PASSED,
  );
  const failedProposals = await fetchProposalsByStatus(
    api,
    ProposalStatus.PROPOSAL_STATUS_FAILED,
  );
  const rejectedProposals = await fetchProposalsByStatus(
    api,
    ProposalStatus.PROPOSAL_STATUS_REJECTED,
  );
  const combined = [
    ...passedProposals,
    ...failedProposals,
    ...rejectedProposals,
  ];
  return sortProposals(combined);
};

const sortProposals = (proposals: Proposal[]): ICosmosProposal[] => {
  return proposals
    .map((p) => msgToIProposal(p))
    .filter((p) => !!p)
    .sort((p1, p2) => +p2.identifier - +p1.identifier);
};

export const msgToIProposal = (p: Proposal): ICosmosProposal | null => {
  const content = p.content;
  const status = stateEnumToString(p.status);
  // TODO: support more types
  const { title, description } = TextProposal.decode(content.value);
  const isCommunitySpend = content.typeUrl?.includes(
    'CommunityPoolSpendProposal',
  );
  let type: CosmosProposalType = 'text';
  let spendRecipient: string;
  let spendAmount: CoinObject[];
  if (isCommunitySpend) {
    const spend = CommunityPoolSpendProposal.decode(content.value);
    type = 'communitySpend';
    spendRecipient = spend.recipient;
    spendAmount = spend.amount[0]
      ? [
          new CosmosToken(
            spend.amount[0]?.denom,
            spend.amount[0]?.amount,
          ).toCoinObject(),
        ]
      : [];
  }
  return {
    identifier: p.proposalId.toString(),
    type,
    title,
    description,
    submitTime: moment.unix(p.submitTime.seconds.toNumber()),
    depositEndTime: moment.unix(p.depositEndTime.seconds.toNumber()),
    votingEndTime: moment.unix(p.votingEndTime.seconds.toNumber()),
    votingStartTime: moment.unix(p.votingStartTime.seconds.toNumber()),
    proposer: null,
    spendRecipient,
    spendAmount,
    state: {
      identifier: p.proposalId.toString(),
      completed: isCompleted(status),
      status,
      // TODO: handle non-default amount
      totalDeposit:
        p.totalDeposit && p.totalDeposit[0]
          ? new BN(p.totalDeposit[0].amount)
          : new BN(0),
      depositors: [],
      voters: [],
      tally: p.finalTallyResult && marshalTally(p.finalTallyResult),
    },
  };
};

export const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

/* -- As of Cosmos SDK v0.46.11, the below also work for gov v1: -- */

export const encodeMsgSubmitProposal = (
  sender: string,
  initialDeposit: CosmosToken,
  content: Any,
): MsgSubmitProposalEncodeObject => {
  return {
    typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
    value: {
      initialDeposit: [initialDeposit.toCoinObject()],
      proposer: sender,
      content,
    },
  };
};

export const encodeMsgVote = (
  voter: string,
  proposalId: number | Long.Long | string,
  option: number,
): MsgVoteEncodeObject => {
  return {
    typeUrl: '/cosmos.gov.v1beta1.MsgVote',
    value: {
      proposalId: longify(proposalId),
      voter,
      option,
    },
  };
};

export const encodeTextProposal = (title: string, description: string): Any => {
  const tProp = TextProposal.fromPartial({ title, description });
  return Any.fromPartial({
    typeUrl: '/cosmos.gov.v1beta1.TextProposal',
    value: Uint8Array.from(TextProposal.encode(tProp).finish()),
  });
};

// TODO: support multiple amount types
export const encodeCommunitySpend = (
  title: string,
  description: string,
  recipient: string,
  amount: string,
  denom: string,
): Any => {
  const coinAmount = [{ amount, denom }];
  const spend = CommunityPoolSpendProposal.fromPartial({
    title,
    description,
    recipient,
    amount: coinAmount,
  });
  const prop = CommunityPoolSpendProposal.encode(spend).finish();
  return Any.fromPartial({
    typeUrl: '/cosmos.distribution.v1beta1.CommunityPoolSpendProposal',
    value: prop,
  });
};

export interface CosmosDepositParams {
  minDeposit: CosmosToken;
}

export const getDepositParams = async (
  cosmosChain: Cosmos,
  stakingDenom?: string,
): Promise<CosmosDepositParams> => {
  const govController = cosmosChain.governance as CosmosGovernance;
  let minDeposit;
  const { depositParams } = await cosmosChain.chain.api.gov.params('deposit');

  // TODO: support off-denom deposits
  const depositCoins = depositParams.minDeposit.find(
    ({ denom }) => denom === stakingDenom,
  );
  if (depositCoins) {
    minDeposit = new CosmosToken(
      depositCoins.denom,
      new BN(depositCoins.amount),
    );
  } else {
    throw new Error(
      `Gov minDeposit in wrong denom (${minDeposit}) or stake denom not loaded: 
      ${cosmosChain.chain.denom}`,
    );
  }
  govController.setMinDeposit(minDeposit);
  return { minDeposit };
};
