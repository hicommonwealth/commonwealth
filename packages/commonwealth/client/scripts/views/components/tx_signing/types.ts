import type { EventEmitter } from 'events';
import type { ITransactionResult } from 'models';

export type TxDataState = Partial<ITransactionResult> & {
  error?: Error;
  events?: EventEmitter;
};

export type StageName = 'intro' | 'waiting' | 'success' | 'rejected';

export type NextFn = {
  next: (newStage: StageName, newData?: TxDataState) => void;
};
