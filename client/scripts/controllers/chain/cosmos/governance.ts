import BN from 'bn.js';
import moment from 'moment';
import _ from 'underscore';
import {
  ITXModalData,
  ProposalModule,
} from 'models';
import { fromAscii } from '@cosmjs/encoding';
import { MsgSubmitProposalEncodeObject } from '@cosmjs/stargate';
import { Proposal, TextProposal, ProposalStatus, TallyResult } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { Any } from 'cosmjs-types/google/protobuf/any';
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
  private _govDenom: string;
  public get votingPeriodNs() { return this._votingPeriodS; }
  public get yesThreshold() { return this._yesThreshold; }
  public get vetoThreshold() { return this._vetoThreshold; }
  public get maxDepositPeriodNs() { return this._maxDepositPeriodS; }
  public get minDeposit() { return this._minDeposit; }
  public get govDenom() { return this._govDenom; }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  private asciiLiteralToDecimal(n: Uint8Array) {
    // 500000000000000000 = 0.5
    // dividing by 1000000000000000 gives 3 decimal digits of precision
    const nStr = fromAscii(n);
    return +((new BN(nStr)).div(this._Chain.decimals)) / 1000;
  }

  public async init(ChainInfo: CosmosChain, Accounts: CosmosAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // query chain-wide params
    const { depositParams } = await this._Chain.api.gov.params('deposit');
    const { tallyParams } = await this._Chain.api.gov.params('tallying');
    const { votingParams } = await this._Chain.api.gov.params('voting');
    this._votingPeriodS = votingParams.votingPeriod.seconds.toNumber();
    this._yesThreshold = this.asciiLiteralToDecimal(tallyParams.threshold);
    this._vetoThreshold = this.asciiLiteralToDecimal(tallyParams.vetoThreshold);
    this._maxDepositPeriodS = depositParams.maxDepositPeriod.seconds.toNumber();

    // TODO: support off-denom deposits
    const [depositCoins] = depositParams.minDeposit;
    this._govDenom = depositCoins.denom;
    this._minDeposit = this._Chain.coins(new BN(depositCoins.amount), false, this.govDenom);

    // query existing proposals
    await this._initProposals();
    this._initialized = true;
  }

  public marshalTally(tally: TallyResult): ICosmosProposalTally {
    if (!tally) return null;
    return {
      yes: this._Chain.coins(new BN(tally.yes), false, this.govDenom),
      abstain: this._Chain.coins(new BN(tally.abstain), false, this.govDenom),
      no: this._Chain.coins(new BN(tally.no), false, this.govDenom),
      noWithVeto: this._Chain.coins(new BN(tally.noWithVeto), false, this.govDenom),
    };
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
          totalDeposit: p.totalDeposit && p.totalDeposit[0] ? new BN(p.totalDeposit[0].amount) : new BN(0),
          depositors: [],
          voters: [],
          tally: p.finalTallyResult && this.marshalTally(p.finalTallyResult),
        }
      };
    };

    let cosmosProposals: CosmosProposal[];
    if (!proposalId) {
      const { proposals, pagination } = await this._Chain.api.gov.proposals(0, '', '');

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
      cosmosProposals = [ new CosmosProposal(this._Chain, this._Accounts, this, msgToIProposal(proposal)) ];
    }
    await Promise.all(cosmosProposals.map((p) => p.init()));
  }

  public createTx(
    sender: CosmosAccount,
    title: string,
    description: string,
    initialDeposit: CosmosToken,
    memo: string,
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
  ): Promise<number> {
    const tProp = TextProposal.fromPartial({ title, description });
    const msg: MsgSubmitProposalEncodeObject = {
      typeUrl: '/cosmos.gov.v1beta1.MsgSubmitProposal',
      value: {
        initialDeposit: [ initialDeposit.toCoinObject() ],
        proposer: sender.address,
        content: Any.fromPartial({
          typeUrl: '/cosmos.gov.v1beta1.TextProposal',
          value: Uint8Array.from(TextProposal.encode(tProp).finish()),
        }),
      }
    };

    // fetch completed proposal from returned events
    const events = await this._Chain.sendTx(sender, msg);
    console.log(events);
    const submitEvent = events.find((e) => e.type === 'submit_proposal');
    const idAttribute = submitEvent.attributes.find(({ key }) => fromAscii(key) === 'proposal_id');
    const id = +fromAscii(idAttribute.value);
    await this._initProposals(id);
    return id;
  }
}

export default CosmosGovernance;
