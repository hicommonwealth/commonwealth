import Store from './Store';
import { IHasAddress } from './interfaces';

export class StakingStore<T extends IHasAddress> extends Store<T> { }

export default StakingStore;
