import _ from 'underscore';
import {
  ITXModalData,
  ProposalModule,
} from 'models';
import {
  ICosmosProposal, CosmosToken, ICosmosProposalTally
} from 'adapters/chain/cosmos/types';
import { CosmosApi } from 'adapters/chain/cosmos/api';
import { CosmosAccount, CosmosAccounts } from './account';
import CosmosChain from './chain';
import { CosmosProposal } from './proposal';

const isCompleted = (status: string): boolean => {
  return status === 'Passed' || status === 'Rejected' || status === 'Failed';
};

export const marshalTally = (tally): ICosmosProposalTally => {
  if (!tally) return null;
  return {
    yes: +tally.yes,
    abstain: +tally.abstain,
    no: +tally.no,
    noWithVeto: +tally.no_with_veto,
  };
};

class CosmosGovernance extends ProposalModule<
  CosmosApi,
  ICosmosProposal,
  CosmosProposal
> {
  private _votingPeriodNs: number;
  private _yesThreshold: number;
  private _vetoThreshold: number;
  private _penalty: number;
  private _maxDepositPeriodNs: number;
  private _minDeposit: CosmosToken;
  public get votingPeriodNs() { return this._votingPeriodNs; }
  public get yesThreshold() { return this._yesThreshold; }
  public get vetoThreshold() { return this._vetoThreshold; }
  public get penalty() { return this._penalty; }
  public get maxDepositPeriodNs() { return this._maxDepositPeriodNs; }
  public get minDeposit() { return this._minDeposit; }

  private _Chain: CosmosChain;
  private _Accounts: CosmosAccounts;

  public async init(ChainInfo: CosmosChain, Accounts: CosmosAccounts): Promise<void> {
    this._Chain = ChainInfo;
    this._Accounts = Accounts;

    // query chain-wide params
    const [ depositParams, tallyingParams, votingParams ] = await Promise.all([
      this._Chain.api.query.govDepositParameters(),
      this._Chain.api.query.govTallyingParameters(),
      this._Chain.api.query.govVotingParameters(),
    ]);
    this._votingPeriodNs = +votingParams.voting_period;
    this._yesThreshold = +tallyingParams.threshold;
    this._vetoThreshold = +tallyingParams.veto;
    this._penalty = +tallyingParams.governance_penalty;
    this._maxDepositPeriodNs = +depositParams.max_deposit_period;
    this._minDeposit = new CosmosToken(depositParams.min_deposit[0].denom, +depositParams.min_deposit[0].amount);

    // query existing proposals
    await this._initProposals();
    this._initialized = true;
  }

  private async _initProposals(): Promise<void> {
    const api = this._Chain.api;
    const msgToIProposal = (p): ICosmosProposal => {
      // handle older cosmoshub types
      const content = p.content || p.proposal_content;
      return {
        identifier: p.id || p.proposal_id,
        type: content.type,
        title: content.value.title,
        description: content.value.description,
        submitTime: p.submit_time,
        depositEndTime: p.deposit_end_time,
        votingEndTime: p.voting_end_time,
        votingStartTime: p.voting_start_time,
        proposer: p.proposer || null,
        state: {
          identifier: p.id || p.proposal_id,
          completed: isCompleted(p.proposal_status),
          status: p.proposal_status,
          totalDeposit: p.total_deposit ? +p.total_deposit.amount : 0,
          depositors: [],
          voters: [],
          tally: marshalTally(p.final_tally_result),
        }
      };
    };
    const proposalResps = await Promise.all([
      api.queryUrl('/gov/proposals?status=deposit_period', null, null, false),
      api.queryUrl('/gov/proposals?status=voting_period', null, null, false),
      api.queryUrl('/gov/proposals?status=passed', null, null, false),
      // limit the number of rejected proposals we fetch
      api.queryUrl('/gov/proposals?status=rejected', 1, 10, false),
    ]);

    const proposalMsgs = _.flatten(proposalResps.map((ps) => ps || [])).sort((p1, p2) => +p2.id - +p1.id);
    const proposals = proposalMsgs.map((p) => msgToIProposal(p));
    proposals.forEach((p) => new CosmosProposal(this._Chain, this._Accounts, this, p));
  }

  // TODO: cosmos-api only supports text proposals and not parameter_change or software_upgrade
  public createTx(
    sender: CosmosAccount, title: string, description: string, initialDeposit: CosmosToken, memo: string = ''
  ): ITXModalData {
    const args = { title, description, initialDeposits: [initialDeposit.toCoinObject()] };
    const txFn = (gas: number) => this._Chain.api.tx(
      'MsgSubmitProposal', sender.address, args, memo, gas, this._Chain.denom
    );
    return this._Chain.createTXModalData(
      sender,
      txFn,
      'MsgSubmitProposal',
      `${sender.address} submits proposal: ${title}.`,
    );
  }
}

export default CosmosGovernance;
