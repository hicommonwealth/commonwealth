import type { Coin } from 'adapters/currency';
import type { IIdentifiable } from 'adapters/shared';
import type BN from 'bn.js';
import type { EventEmitter } from 'events';
import type moment from 'moment';
import type Account from './Account';
import type StorageModule from './StorageModule';
import type { TransactionStatus } from './types';

/* eslint-disable */

export interface IBlockInfo {
  height: number;
  duration: number;
  lastTime: moment.Moment;
  isIrregular: boolean;
}

// TODO: abstract this for edgeware? Maybe replace with "command string"?
export interface ITXData {
  call: string;
}

// TODO: figure out how to abstract this to make the tx_signing_modal work with cosmos
export type ITXModalData = {
  author: Account;
  txType: string;
  txData: {
    // subscribe to transaction events
    events: EventEmitter;

    // get blob of tx data to sign
    unsignedData: () => Promise<ITXData>;

    // perform transaction
    transact: (...args) => void;
  };

  // callback triggered upon exit
  cb?: (success: boolean) => void;
};

// Implemented by a chain's top-level module. Responsible for high-level
// metadata, API, and event-handling functionality.
export interface IChainModule<C extends Coin, A extends Account> {
  coins(n: number | BN, inDollars?: boolean): C;

  denom: string;
}

// Implemented by a chain's account module. Store for account objects.
export interface IAccountsModule<A extends Account> extends StorageModule {
  // Converts an address into an account module. Should check storage prior to
  // creating a new account object.
  get(address: string, keytype?: string, ignoreProfile?: boolean): A;
}

export type IBalanceAccount<C extends Coin> = Account & { balance: Promise<C> };

export interface IVote<C extends Coin> {
  account: IBalanceAccount<C>;
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

export interface IGatedTopic {
  id: number;
  type: string;
  data: {
    threshold: number;
  };
}
