import BN from 'bn.js';
import moment from 'moment-twitter';
import { Observable } from 'rxjs';
import { Coin } from 'adapters/currency';
import { IIdentifiable } from 'adapters/shared';
import { TransactionStatus } from './types';
import Account from './Account';
import StorageModule from './StorageModule';
import { IApp } from '../state';

export interface IBlockInfo {
  height: number;
  duration: number;
  lastTime: moment.Moment;
  isIrregular: boolean;
}

// Implemented by a chain's top-level module. Responsible for high-level
// metadata, API, and event-handling functionality.
export interface IChainModule<C extends Coin, A extends Account<C>> {
  coins(n: number | BN, inDollars?: boolean): C;
  denom: string;

  hasWebWallet(): boolean;

  // Signs and submits an on-chain transaction, wrapping it in a modal dialog that tracks its status.
  createTXModalData(
    author: A,
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void): ITXModalData;
}

// Implemented by a chain's account module. Store for account objects.
export interface IAccountsModule<C extends Coin, A extends Account<C>> extends StorageModule {
  // Converts an address into an account module. Should check storage prior to
  // creating a new account object.
  get(address: string, keytype?: string): A;
}

// Offchain stores and management for discussion features.
export interface IOffchainAccountsModule<C extends Coin, A extends Account<C>> extends StorageModule {
  get(address: string, chain?: string): A;
}

export interface ITransactionResult {
  status: TransactionStatus;
  hash?: string;
  err?: string;
  blocknum?: number;
  timestamp?: moment.Moment;
}

// TODO: abstract this for edgeware? Maybe replace with "command string"?
export interface ITXData {
  call: string;
}

// TODO: figure out how to abstract this to make the tx_signing_modal work with cosmos
export interface ITXModalData {
  author: Account<any>;
  txType: string;
  txData: {
    // get blob of tx data to sign
    unsignedData: () => Promise<ITXData>,

    // perform transaction
    transact: () => Observable<ITransactionResult>
  };

  // callback triggered upon exit
  cb?: (success: boolean) => void;
}

export interface IVote<C extends Coin> {
  account: Account<C>;
}

export interface IUniqueId extends IIdentifiable {
  readonly uniqueIdentifier: string;
  readonly slug: string;
}

export interface IFixedEndTime {
  kind: 'fixed';
  time: moment.Moment;
}
export interface IFixedBlockEndTime {
  kind: 'fixed_block';
  blocknum: number;
}
export interface IDynamicEndTime {
  kind: 'dynamic';
  getBlocknum(): number;
}
export interface IThresholdEndTime {
  kind: 'threshold';
  threshold: number;
}
export interface INotStartedEndTime {
  kind: 'not_started';
}
export interface IUnavailableEndTime {
  kind: 'unavailable';
}
export interface IQueuedEndTime {
  kind: 'queued';
}
