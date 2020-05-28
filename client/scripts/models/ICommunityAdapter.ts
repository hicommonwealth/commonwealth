import { ApiStatus, IApp } from 'state';
import { Coin } from 'adapters/currency';
import { IOffchainAccountsModule } from './interfaces';
import Account from './Account';
import CommunityInfo from './CommunityInfo';

// TODO create some generic class for ICommunity and IChainAdapter
abstract class ICommunityAdapter<C extends Coin, A extends Account<C>> {
  public abstract loaded: boolean;
  public abstract serverLoaded: boolean;

  public abstract accounts: IOffchainAccountsModule<C, A>;

  public abstract init: (onServerLoaded? : () => void) => Promise<void>;
  public abstract deinit: () => Promise<void>;

  public networkStatus: ApiStatus = ApiStatus.Connected;
  public name: string;
  public readonly meta: CommunityInfo;
  public app: IApp;

  constructor(meta: CommunityInfo, app: IApp) {
    this.meta = meta;
    this.app = app;
  }

  get id() {
    return this.meta.id;
  }
}

export default ICommunityAdapter;
