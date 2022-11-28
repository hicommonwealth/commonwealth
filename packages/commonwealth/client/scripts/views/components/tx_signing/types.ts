import { EventEmitter } from 'events';
import { TransactionResult } from 'models';

export type TxDataState = Partial<TransactionResult> & {
  error?: Error;
  events?: EventEmitter;
};

export type StageName = 'intro' | 'waiting' | 'success' | 'rejected';

export type NextFn = {
  next: (newStage: StageName, newData?: TxDataState) => void;
};
