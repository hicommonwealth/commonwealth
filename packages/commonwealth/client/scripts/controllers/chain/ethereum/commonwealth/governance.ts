// import { ICommonwealthProposalResponse } from 'adapters/chain/moloch/types';
// import { CommonwealthEvents } from 'chain-events/src';
import type { IApp } from 'state';
import type { ITXModalData } from '../../../../models/interfaces';
import ProposalModule from '../../../../models/ProposalModule';

// import CommonwealthProposal from './proposal';
import type CommonwealthAPI from './api';
import type CommonwealthChain from './chain';

export default class CommonwealthGovernance extends ProposalModule<
  any,
  any,
  any
  // CommonwealthAPI,
  // ICommonwealthProposalResponse,
  // CommonwealthProposal
> {
  // MEMBERS
  // private _proposalCount: BN;
  // private _proposalDeposit: BN;
  // private _gracePeriod: BN;
  // private _summoningTime: BN;
  // private _votingPeriodLength: BN;
  // private _periodDuration: BN;
  // private _abortWindow: BN;
  // private _totalShares: BN;
  // private _totalSharesRequested: BN;
  // private _guildBank: string;

  private _api: CommonwealthAPI;

  // GETTERS
  // public get proposalCount() { return this._proposalCount; }
  // public get proposalDeposit() { return this._proposalDeposit; }
  // public get gracePeriod() { return this._gracePeriod; }
  // public get summoningTime() { return this._summoningTime; }
  // public get votingPeriodLength() { return this._votingPeriodLength; }
  // public get periodDuration() { return this._periodDuration; }
  // public get abortWindow() { return this._abortWindow; }
  // public get totalShares() { return this._totalShares; }
  // public get totalSharesRequested() { return this._totalSharesRequested; }
  // public get guildbank() { return this._guildBank; }
  // public get currentPeriod() {
  //   return ((Date.now() / 1000) - this.summoningTime.toNumber()) / this.periodDuration.toNumber();
  // }

  public get api() {
    return this._api;
  }

  // INIT / DEINIT
  constructor(app: IApp) {
    super(app, () => {
      return null;
      // return new CommonwealthProposal(this._Members, this, e);
    });
  }

  public async init(chain: CommonwealthChain) {
    const api = chain.commonwealthApi;
    this._api = api;
    // this._guildBank = await this._api.Contract.guildBank();

    // this._totalSharesRequested = new BN((await this._api.Contract.totalSharesRequested()).toString(), 10);
    // this._totalShares = new BN((await this._api.Contract.totalShares()).toString(), 10);
    // this._gracePeriod = new BN((await this._api.Contract.gracePeriodLength()).toString(), 10);
    // this._abortWindow = new BN((await this._api.Contract.abortWindow()).toString(), 10);
    // this._summoningTime = new BN((await this._api.Contract.summoningTime()).toString(), 10);
    // this._votingPeriodLength = new BN((await this._api.Contract.votingPeriodLength()).toString(), 10);
    // this._periodDuration = new BN((await this._api.Contract.periodDuration()).toString(), 10);
    // this._proposalDeposit = new BN((await this._api.Contract.proposalDeposit()).toString(), 10);

    // TODO: fetch all proposals
    // if (this._usingServerChainEntities) {
    //   console.log('Fetching moloch proposals from backend.');
    //   await this.app.chainEntities.refresh(this.app.chain.id);
    //   const entities = this.app.chainEntities.getByType(CommonwealthEvents.Types.EntityKind.Proposal);
    //   entities.map((p) => this._entityConstructor(p));
    // } else {
    //   console.log('Fetching moloch proposals from chain.');
    //   const fetcher = new CommonwealthEvents.StorageFetcher(
    //     api.Contract,
    //     1,
    //     new EthDater((this.app.chain as Commonwealth).chain.api)
    //   );
    //   const subscriber = new CommonwealthEvents.Subscriber(api.Contract, this.app.chain.id);
    //   const processor = new CommonwealthEvents.Processor(api.Contract, 1);
    //   await this.app.chainEntities.fetchEntities(this.app.chain.id, () => fetcher.fetch());
    //   await this.app.chainEntities.subscribeEntities(
    //     this.app.chain.id,
    //     subscriber,
    //     processor,
    //   );
    // }
    // this._proposalCount = new BN(this.store.getAll().length);
    this._initialized = true;
  }

  public deinit() {
    this.store.clear();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }

  // insert governance actions here
}
