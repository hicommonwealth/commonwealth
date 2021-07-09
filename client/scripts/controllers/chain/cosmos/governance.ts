import BN from 'bn.js';
import {
  GovParametersDepositResponse,
  GovParametersTallyingResponse,
  GovParametersType,
  GovParametersVotingResponse,
  Proposal,
  Tally,
} from '@cosmjs/launchpad/build/lcdapi/gov';
import _ from 'underscore';
import {
  ITXModalData,
  ProposalModule,
} from 'models';
import {
  ICosmosProposal, CosmosToken, ICosmosProposalTally, CosmosProposalType, CosmosProposalState
} from 'controllers/chain/cosmos/types';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain, { CosmosApiType } from './chain';
import { CosmosProposal } from './proposal';

const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

export const marshalTally = (tally: Tally): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: new BN(tally.yes),
    abstain: new BN(tally.abstain),
    no: new BN(tally.no),
    noWithVeto: new BN(tally.no_with_veto),
  };
};

class CosmosGovernance extends ProposalModule<
  CosmosApiType,
  ICosmosProposal,
  CosmosProposal
> {
  private _votingPeriodNs: number;
  private _yesThreshold: number;
  private _vetoThreshold: number;
  private _maxDepositPeriodNs: number;
  private _minDeposit: CosmosToken;
  public get votingPeriodNs() { return this._votingPeriodNs; }
  public get yesThreshold() { return this._yesThreshold; }
  public get vetoThreshold() { return this._vetoThreshold; }
  public get maxDepositPeriodNs() { return this._maxDepositPeriodNs; }
  public get minDeposit() { return this._minDeposit; }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  public async init(ChainInfo: CosmosChain, Accounts: CosmosAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // query chain-wide params
    const depositParams = await this._Chain.api.gov.parameters(
      GovParametersType.Deposit
    ) as GovParametersDepositResponse;
    const tallyingParams = await this._Chain.api.gov.parameters(
      GovParametersType.Tallying
    ) as GovParametersTallyingResponse;
    const votingParams = await this._Chain.api.gov.parameters(
      GovParametersType.Voting
    ) as GovParametersVotingResponse;
    this._votingPeriodNs = +votingParams.result.voting_period;
    this._yesThreshold = +tallyingParams.result.threshold;
    this._vetoThreshold = +tallyingParams.result.veto;
    this._maxDepositPeriodNs = +depositParams.result.max_deposit_period;
    this._minDeposit = new CosmosToken(
      depositParams.result.min_deposit[0].denom,
      new BN(depositParams.result.min_deposit[0].amount),
    );

    // query existing proposals
    await this._initProposals();
    this._initialized = true;
  }

  private async _initProposals(): Promise<void> {
    const msgToIProposal = (p: Proposal): ICosmosProposal => {
      const content = p.content;
      return {
        identifier: p.id,
        type: content.type as CosmosProposalType,
        title: content.value.title,
        description: content.value.description,
        submitTime: p.submit_time,
        depositEndTime: p.deposit_end_time,
        votingEndTime: p.voting_end_time,
        votingStartTime: p.voting_start_time,
        proposer: null,
        state: {
          identifier: p.id,
          completed: isCompleted(p.proposal_status),
          status: p.proposal_status as CosmosProposalState,
          totalDeposit: p.total_deposit && p.total_deposit[0] ? new BN(p.total_deposit[0].amount) : new BN(0),
          depositors: [],
          voters: [],
          tally: marshalTally(p.final_tally_result),
        }
      };
    };
    const proposalsResponse = await this._Chain.api.gov.proposals();
    const proposals = proposalsResponse.result
      .map((p) => msgToIProposal(p))
      .sort((p1, p2) => +p2.identifier - +p1.identifier);
    proposals.forEach((p) => new CosmosProposal(this._Chain, this._Accounts, this, p));
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
