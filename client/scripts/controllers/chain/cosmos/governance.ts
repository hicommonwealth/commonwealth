import BN from 'bn.js';
import moment from 'moment';
import _ from 'underscore';
import {
  ITXModalData,
  ProposalModule,
} from 'models';
import { fromAscii } from '@cosmjs/encoding';
import { Proposal, TextProposal, ProposalStatus, TallyResult } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import {
  ICosmosProposal, CosmosToken, ICosmosProposalTally, CosmosProposalState
} from 'controllers/chain/cosmos/types';
import CosmosAccount from './account';
import CosmosAccounts from './accounts';
import CosmosChain, { CosmosApiType } from './chain';
import { CosmosProposal } from './proposal';

const stateEnumToString = (status: ProposalStatus): CosmosProposalState => {
  switch (status) {
    case ProposalStatus.PROPOSAL_STATUS_DEPOSIT_PERIOD: return 'DepositPeriod';
    case ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD: return 'VotingPeriod';
    case ProposalStatus.PROPOSAL_STATUS_PASSED: return 'Passed';
    case ProposalStatus.PROPOSAL_STATUS_FAILED: return 'Failed';
    case ProposalStatus.PROPOSAL_STATUS_REJECTED: return 'Rejected';
    default: throw new Error(`Invalid proposal state: ${status}`);
  }
};

const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

const asciiLiteralToDecimal = (n: Uint8Array) => {
  // 500000000000000000 = 0.5
  // dividing by 1000000000000000 gives 3 decimal digits of precision
  const nStr = fromAscii(n);
  return +((new BN(nStr)).div(new BN('1000000000000000'))) / 1000;
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
  public get votingPeriodNs() { return this._votingPeriodS; }
  public get yesThreshold() { return this._yesThreshold; }
  public get vetoThreshold() { return this._vetoThreshold; }
  public get maxDepositPeriodNs() { return this._maxDepositPeriodS; }
  public get minDeposit() { return this._minDeposit; }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  public async init(ChainInfo: CosmosChain, Accounts: CosmosAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // query chain-wide params
    console.log('api.gov.params.deposit!');
    const { depositParams } = await this._Chain.api.gov.params('deposit');
    console.log('api.gov.params.tally!');
    const { tallyParams } = await this._Chain.api.gov.params('tallying');
    console.log('api.gov.params.voting!');
    const { votingParams } = await this._Chain.api.gov.params('voting');
    this._votingPeriodS = votingParams.votingPeriod.seconds.toNumber();
    this._yesThreshold = asciiLiteralToDecimal(tallyParams.threshold);
    this._vetoThreshold = asciiLiteralToDecimal(tallyParams.vetoThreshold);
    this._maxDepositPeriodS = depositParams.maxDepositPeriod.seconds.toNumber();

    // TODO: support off-denom deposits
    const depositCoins = depositParams.minDeposit.find(({ denom }) => denom === this._Chain.denom);
    if (depositCoins) {
      this._minDeposit = new CosmosToken(
        depositCoins.denom,
        new BN(depositCoins.amount),
      );
    } else {
      console.error('Gov minDeposit in wrong denom:', depositParams.minDeposit);
      this._minDeposit = new CosmosToken(this._Chain.denom, 0);
    }

    // query existing proposals
    await this._initProposals();
    this._initialized = true;
  }

  private async _initProposals(): Promise<void> {
    const msgToIProposal = (p: Proposal): ICosmosProposal | null => {
      const content = p.content;
      // TODO: support all sorts of proposals:
      // - UpdatePoolIncentivesProposal
      // - ParameterChangeProposal
      // - CommunityPoolSpendProposal
      // others?
      if (content.typeUrl !== '/cosmos.gov.v1beta1.TextProposal') {
        console.log(`Unsupported proposal content: ${content.typeUrl}`, p);
        return null;
      }
      const status = stateEnumToString(p.status);
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
          totalDeposit: p.totalDeposit && p.totalDeposit[0] ? new BN(p.totalDeposit[0].amount) : new BN(0),
          depositors: [],
          voters: [],
          tally: marshalTally(p.finalTallyResult),
        }
      };
    };

    // TODO: ensure all proposals fetched regardless of state
    console.log('api.gov.proposals!');
    const { proposals } = await this._Chain.api.gov.proposals(0, '', '');
    proposals
      .map((p) => msgToIProposal(p))
      .filter((p) => !!p)
      .sort((p1, p2) => +p2.identifier - +p1.identifier)
      .forEach((p) => new CosmosProposal(this._Chain, this._Accounts, this, p));
  }

  public createTx(
    sender: CosmosAccount, title: string, description: string, initialDeposit: CosmosToken, memo: string = ''
  ): ITXModalData {
    throw new Error('unsupported');
  }

  // TODO: support multiple deposit types
  // TODO: support multiple proposal types (not just text)
  public async submitProposalTx(
    sender: CosmosAccount,
    title: string,
    description: string,
    initialDeposit: CosmosToken,
  ) {
    /*
    const msg: MsgSubmitProposal = {
      type: 'cosmos-sdk/MsgSubmitProposal',
      value: {
        content: {
          type: 'cosmos-sdk/TextProposal',
          value: {
            description,
            title,
          },
        },
        initial_deposit: [ initialDeposit.toCoinObject() ],
        proposer: sender.address,
      }
    };
    await this._Chain.sendTx(sender, msg);
    */
    throw new Error('proposal submission not yet implemented');
  }
}

export default CosmosGovernance;
