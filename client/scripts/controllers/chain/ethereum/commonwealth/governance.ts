import BN from 'bn.js';
import EthDater from 'ethereum-block-by-date';

import { ProposalModule, ITXModalData, ChainEntity, IChainModule } from 'models';

import { ERC20Token, EthereumCoin } from 'adapters/chain/ethereum/types';
// import { ICommonwealthProposalResponse } from 'adapters/chain/moloch/types';
import { EntityRefreshOption } from 'controllers/server/chain_entities';

// import { CommonwealthEvents } from '@commonwealth/chain-events';

import { IApp } from 'state';

// import CommonwealthProposal from './proposal';
import CommonwealthAPI from './api';
import Commonwealth from './adapter';
import CommonwealthChain from './chain';

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

  public get api() { return this._api; }
  public get usingServerChainEntities() { return this._usingServerChainEntities; }

  // INIT / DEINIT
  constructor(app: IApp, private _usingServerChainEntities = false) {
    super(app, (e) => {
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
    //   await this.app.chain.chainEntities.refresh(this.app.chain.id, EntityRefreshOption.AllEntities);
    //   const entities = this.app.chain.chainEntities.store.getByType(CommonwealthEvents.Types.EntityKind.Proposal);
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
    //   await this.app.chain.chainEntities.fetchEntities(this.app.chain.id, () => fetcher.fetch());
    //   await this.app.chain.chainEntities.subscribeEntities(
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

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }

  // insert governance actions here
}
