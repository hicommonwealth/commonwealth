import { EventEmitter } from 'events';
import { ITransactionResult } from 'models';

export type TxDataState = Partial<ITransactionResult> & {
  error?: Error;
  events?: EventEmitter;
};

export type NextFn = (newState: string, newData?: TxDataState) => void;

export type StageName = 'intro' | 'waiting' | 'success' | 'rejected';
