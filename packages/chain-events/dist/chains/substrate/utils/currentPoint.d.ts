import { AccountId, EraIndex, BlockHash } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import { AccountPoints } from '../types';
export declare function currentPoints(api: ApiPromise, era: EraIndex, hash: BlockHash, validators: AccountId[]): Promise<AccountPoints>;
