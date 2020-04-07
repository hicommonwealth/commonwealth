import { CommunityInfo, ICommunityAdapter } from 'models';

import { Coin } from 'adapters/currency';
import OffchainAccounts, { OffchainAccount } from './account';

class Community extends ICommunityAdapter<Coin, OffchainAccount> {
  private _loaded: boolean = false;
  public accounts: OffchainAccounts;
  public readonly server = {};

  get loaded() { return this._loaded; }

  private _serverLoaded: boolean = false;
  get serverLoaded() { return this._serverLoaded; }

  public init = async () => {
    console.log(`Starting ${this.meta.name}`);
    this.accounts = new OffchainAccounts(this.app);
    await this.app.threads.refreshAll(null, this.id, true);
    await this.app.comments.refreshAll(null, this.id, true);
    await this.app.reactions.refreshAll(null, this.id, true);
    this._serverLoaded = true;
    this._loaded = true;
  }

  public deinit = async (): Promise<void> => {
    this._loaded = false;
    this._serverLoaded = false;
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.reactions.deinit();
    console.log('Community stopped.');
  }
}

export default Community;
