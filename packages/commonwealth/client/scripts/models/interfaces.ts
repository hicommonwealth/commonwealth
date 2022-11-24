import BN from 'bn.js';
import moment from 'moment';
import { EventEmitter } from 'events';
import { Coin } from 'adapters/currency';
import { IIdentifiable } from 'adapters/shared';
import { TransactionStatus } from './types';
import Account from './Account';
import StorageModule from './StorageModule';

export type IBlockInfo = {
  height: number;
  duration: number;
  lastTime: moment.Moment;
  isIrregular: boolean;
}

// Implemented by a chain's top-level module. Responsible for high-level
// metadata, API, and event-handling functionality.
export type IChainModule<C extends Coin, A extends Account> = {
  coins(n: number | BN, inDollars?: boolean): C;
  denom: string;

  // Signs and submits an on-chain transaction, wrapping it in a modal dialog that tracks its status.
  createTXModalData(
    author: A,
    // TODO: type txfunc
    txFunc,
    txName: string,
    objName: string,
    cb?: (success: boolean) => void): ITXModalData;
}

// Implemented by a chain's account module. Store for account objects.
export type IAccountsModule<C extends Coin, A extends Account> extends StorageModule = {
  // Converts an address into an account module. Should check storage prior to
  // creating a new account object.
  get(address: string, keytype?: string): A;
}

// Offchain stores and management for discussion features.
export type IOffchainAccountsModule<C extends Coin, A extends Account> extends StorageModule = {
  get(address: string, chain?: string): A;
}

export type ITransactionResult = {
  status: TransactionStatus;
  hash?: string;
  err?: string;
  blocknum?: number;
  timestamp?: moment.Moment;
}

// TODO: abstract this for edgeware? Maybe replace with "command string"?
export type ITXData = {
  call: string;
}

// TODO: figure out how to abstract this to make the tx_signing_modal work with cosmos
export type ITXModalData = {
  author: Account;
  txType: string;
  txData: {
    // subscribe to transaction events
    events: EventEmitter,

    // get blob of tx data to sign
    unsignedData: () => Promise<ITXData>,

    // perform transaction
    transact: (...args) => void,
  };

  // callback triggered upon exit
  cb?: (success: boolean) => void;
}

export type IBalanceAccount<C extends Coin> = Account & { balance: Promise<C> };

export type IVote<C extends Coin> = {
  account: IBalanceAccount<C>;
}

export type IUniqueId extends IIdentifiable = {
  readonly uniqueIdentifier: string;
  readonly slug: string;
}

export type IFixedEndTime = {
  kind: 'fixed';
  time: moment.Moment;
}
export type IFixedBlockEndTime = {
  kind: 'fixed_block';
  blocknum: number;
}
export type IDynamicEndTime = {
  kind: 'dynamic';
  getBlocknum(): number;
}
export type IThresholdEndTime = {
  kind: 'threshold';
  threshold: number;
}
export type INotStartedEndTime = {
  kind: 'not_started';
}
export type IUnavailableEndTime = {
  kind: 'unavailable';
}
export type IQueuedEndTime = {
  kind: 'queued';
}

export type ICardListItem = {
  button: {
    id: string;
  };
  texts: {
    title: string;
    text: string;
  };
  card: {
    id: string;
    imgSrc: string;
    imgAlt: string;
  };
}
