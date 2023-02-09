import type { MsgSubmitProposalEncodeObject } from '@cosmjs/stargate';
import BN from 'bn.js';
import type {
  CosmosProposalState,
  ICosmosProposal,
  ICosmosProposalTally,
} from 'controllers/chain/cosmos/types';
import { CosmosToken } from 'controllers/chain/cosmos/types';
import { CommunityPoolSpendProposal } from 'cosmjs-types/cosmos/distribution/v1beta1/distribution';
import type {
  Proposal,
  TallyResult,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  ProposalStatus,
  TextProposal,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { Any } from 'cosmjs-types/google/protobuf/any';
import type { ITXModalData } from 'models';
import { ProposalModule } from 'models';
import moment from 'moment';
import type CosmosAccount from './account';
import type CosmosAccounts from './accounts';
import type CosmosChain from './chain';
import type { CosmosApiType } from './chain';
import { CosmosProposal } from './proposal';

const stateEnumToString = (status: ProposalStatus): CosmosProposalState => {
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

const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

const asciiLiteralToDecimal = async (n: Uint8Array) => {
  // 500000000000000000 = 0.5
  // dividing by 1000000000000000 gives 3 decimal digits of precision
  const cosm = await import('@cosmjs/encoding');
  const nStr = cosm.fromAscii(n);
  return +new BN(nStr).div(new BN('1000000000000000')) / 1000;
};

export const marshalTally = (tally: TallyResult): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: new BN(tally.yes),
    abstain: new BN(tally.abstain),
    no: new BN(tally.no),
    noWithVeto: new BN(tally.noWithVeto),
  };
};

class CosmosGovernance extends ProposalModule<
  CosmosApiType,
  ICosmosProposal,
  CosmosProposal
> {
  private _votingPeriodS: number;
  private _yesThreshold: number;
  private _vetoThreshold: number;
  private _maxDepositPeriodS: number;
  private _minDeposit: CosmosToken;

  public get vetoThreshold() {
    return this._vetoThreshold;
  }

  public get minDeposit() {
    return this._minDeposit;
  }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  public async init(
    ChainInfo: CosmosChain,
    Accounts: CosmosAccounts
  ): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // query chain-wide params
    const { depositParams } = await this._Chain.api.gov.params('deposit');
    const { tallyParams } = await this._Chain.api.gov.params('tallying');
    const { votingParams } = await this._Chain.api.gov.params('voting');
    this._votingPeriodS = votingParams.votingPeriod.seconds.toNumber();
    this._yesThreshold = await asciiLiteralToDecimal(tallyParams.threshold);
    this._vetoThreshold = await asciiLiteralToDecimal(
      tallyParams.vetoThreshold
    );
    this._maxDepositPeriodS = depositParams.maxDepositPeriod.seconds.toNumber();

    // TODO: support off-denom deposits
    const depositCoins = depositParams.minDeposit.find(
      ({ denom }) => denom === this._Chain.denom
    );
    if (depositCoins) {
      this._minDeposit = new CosmosToken(
        depositCoins.denom,
        new BN(depositCoins.amount)
      );
    } else {
      console.error('Gov minDeposit in wrong denom:', depositParams.minDeposit);
      this._minDeposit = new CosmosToken(this._Chain.denom, 0);
    }
    console.log(this._minDeposit);

    // query existing proposals
    await this._initProposals();
    this._initialized = true;
  }

  private async _initProposals(proposalId?: number): Promise<void> {
    const msgToIProposal = (p: Proposal): ICosmosProposal | null => {
      const content = p.content;
      const status = stateEnumToString(p.status);
      // TODO: support more types
      const { title, description } = TextProposal.decode(content.value);
      return {
        identifier: p.proposalId.toString(),
        type: 'text',
        title,
        description,
        submitTime: moment.unix(p.submitTime.valueOf() / 1000),
        depositEndTime: moment.unix(p.depositEndTime.valueOf() / 1000),
        votingEndTime: moment.unix(p.votingEndTime.valueOf() / 1000),
        votingStartTime: moment.unix(p.votingStartTime.valueOf() / 1000),
        proposer: null,
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

    let cosmosProposals: CosmosProposal[];
    if (!proposalId) {
      const { proposals, pagination } = await this._Chain.api.gov.proposals(
        0,
        '',
        ''
      );

      // fetch all proposals
      // TODO: only fetch next page of proposals on scroll
      let nextKey = pagination.nextKey;
      while (nextKey.length > 0) {
        console.log(nextKey);
        const { proposals: addlProposals, pagination: nextPage } =
          await this._Chain.api.gov.proposals(0, '', '', nextKey);
        proposals.push(...addlProposals);
        nextKey = nextPage.nextKey;
      }

      cosmosProposals = proposals
        .map((p) => msgToIProposal(p))
        .filter((p) => !!p)
        .sort((p1, p2) => +p2.identifier - +p1.identifier)
        .map((p) => new CosmosProposal(this._Chain, this._Accounts, this, p));
    } else {
      const { proposal } = await this._Chain.api.gov.proposal(proposalId);
      cosmosProposals = [
        new CosmosProposal(
          this._Chain,
          this._Accounts,
          this,
          msgToIProposal(proposal)
        ),
      ];
    }
    Promise.all(cosmosProposals.map((p) => p.init()));
  }

  public createTx(
    sender: CosmosAccount,
    title: string,
    description: string,
    initialDeposit: CosmosToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    memo = ''
  ): ITXModalData {
    throw new Error('unsupported');
  }

  public encodeTextProposal(title: string, description: string): Any {
    const tProp = TextProposal.fromPartial({ title, description });
    return Any.fromPartial({
      typeUrl: '/cosmos.gov.v1beta1.TextProposal',
      value: Uint8Array.from(TextProposal.encode(tProp).finish()),
    });
  }

  // TODO: support multiple amount types
  public encodeCommunitySpend(
    title: string,
    description: string,
    recipient: string,
    amount: string
  ): Any {
    const denom = this._minDeposit.denom;
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
  }

  // TODO: support multiple deposit types
  public async submitProposalTx(
    sender: CosmosAccount,
    initialDeposit: CosmosToken,
    content: Any
  ): Promise<number> {
    const msg: MsgSubmitProposalEncodeObject = {
      typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
      value: {
        initialDeposit: [initialDeposit.toCoinObject()],
        proposer: sender.address,
        content,
      },
    };

    // fetch completed proposal from returned events
    const events = await this._Chain.sendTx(sender, msg);
    console.log(events);
    const submitEvent = events.find((e) => e.type === 'submit_proposal');
    const cosm = await import('@cosmjs/encoding');
    const idAttribute = submitEvent.attributes.find(
      ({ key }) => cosm.fromAscii(key) === 'proposal_id'
    );
    const id = +cosm.fromAscii(idAttribute.value);
    await this._initProposals(id);
    return id;
  }
}

export default CosmosGovernance;
