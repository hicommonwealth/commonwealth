import _ from 'underscore';
import {
  ITXModalData,
  ProposalModule,
} from 'models';
import {
  ICosmosProposal, CosmosToken, ICosmosProposalTally
} from 'adapters/chain/cosmos/types';
import { CosmosApi } from 'adapters/chain/cosmos/api';
import { of, forkJoin, Subject, Unsubscribable } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
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

  private _proposalSubscription: Unsubscribable;

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
    return new Promise((resolve, reject) => {
      this._proposalSubscription = this._subscribeNew()
        .pipe(
          flatMap((ps: ICosmosProposal[]) => {
            const props = ps.map((p) => new CosmosProposal(ChainInfo, Accounts, this, p));
            if (props.length === 0) {
              return of(props);
            } else {
              return forkJoin(props.map((p) => p.initialized$)).pipe(map(() => props));
            }
          })
        ).subscribe((props: CosmosProposal[]) => {
          this._initialized = true;
          resolve();
        }, (err) => {
          console.error(`${this.constructor.name}: proposal error: ${JSON.stringify(err)}`);
          reject(new Error(err));
        });
    });
  }

  public deinit() {
    super.deinit();
    if (this._proposalSubscription) {
      this._proposalSubscription.unsubscribe();
    }
  }

  private _subscribeNew() {
    const api = this._Chain.api;
    const subject = new Subject<ICosmosProposal[]>();
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
    Promise.all([
      api.queryUrl('/gov/proposals?status=deposit_period', null, null, false),
      api.queryUrl('/gov/proposals?status=voting_period', null, null, false),
      api.queryUrl('/gov/proposals?status=passed', null, null, false),
      // limit the number of rejected proposals we fetch
      api.queryUrl('/gov/proposals?status=rejected', 1, 10, false),
    ]).then((proposalResps) => {
      const proposals = _.flatten(proposalResps.map((ps) => ps || [])).sort((p1, p2) => +p2.id - +p1.id);
      if (proposals) {
        const proposalPromises = proposals.map(async (p): Promise<ICosmosProposal> => {
          return msgToIProposal(p);
        });
        // emit all proposals
        Promise.all(proposalPromises).then((ps) => subject.next(ps));

        // init stream listener for new proposals
        api.observeEvent('MsgSubmitProposal').subscribe(async ({ msg, events }) => {
          let id;
          /* eslint-disable no-restricted-syntax */
          for (const { attributes } of events) {
            for (const { key, value } of attributes) {
              if (key === 'proposal_id') {
                id = value;
              }
            }
          }
          if (id === undefined) {
            console.log('could not find proposal id in events: ', events);
            return;
          }
          const p = await api.queryUrl(`/gov/proposals/${id}`);
          subject.next([ msgToIProposal(p) ]);
        });
      }
    }, (err) => console.error(err));
    return subject.asObservable();
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
