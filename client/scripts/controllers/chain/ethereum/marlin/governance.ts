import BN from 'bn.js';
import EthDater from 'ethereum-block-by-date';

import { ProposalModule, ITXModalData, ChainEntity, IChainModule } from 'models';

import { ERC20Token, EthereumCoin } from 'adapters/chain/ethereum/types';
import { IMolochProposalResponse } from 'adapters/chain/moloch/types';
import { EntityRefreshOption } from 'controllers/server/chain_entities';

import { MolochEvents } from '@commonwealth/chain-events';

import { IApp } from 'state';


import Marlin from './adapter';
import MarlinAPI from './api';
// import MarlinProposal from './proposal';
// import MarlinHolder from './holders';

export default class MarlinGovernance extends ProposalModule<
MarlinAPI,
Coin,
Proposal,
> {
  // MEMBERS
  private _proposalCount: BN;
  private _votingPeriodLength: BN;
  private _periodDuration: BN;
  private _minimumThreshold: BN;
  private _totalSupply: BN;

  // GETTERS
  public get proposalCount() { return this._proposalCount; }
  public get votingPeriodLength() { return this._votingPeriodLength; }
  public get periodDuration() { return this._periodDuration; }
  public get minimumThreshold() { return this._minimumThreshold; }
  public get totalSupply() { return this._totalSupply; }

  public async init() {
  }

  public deinit() {
    this.store.clear();
  }

  public createTx(...args: any[]): ITXModalData {
    throw new Error('Method not implemented.');
  }


}