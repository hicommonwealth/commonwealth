import { default as m } from 'mithril';
import app, { ApiStatus } from 'state';
import { CommunityInfo, ICommunityAdapter } from 'models/models';

import { Coin } from 'adapters/currency';
import OffchainAccounts, { OffchainAccount } from './account';

class Community extends ICommunityAdapter<Coin, OffchainAccount> {
  private _loaded: boolean = false;
  public readonly accounts: OffchainAccounts = new OffchainAccounts();
  public readonly server = {};

  get loaded() { return this._loaded; }

  private _serverLoaded: boolean = false;
  get serverLoaded() { return this._serverLoaded; }

  public init = async () => {
    console.log(`Starting ${this.meta.name}`);
    await app.threads.refreshAll(null, this.id, true);
    await app.comments.refreshAll(null, this.id, true);
    await app.reactions.refreshAll(null, this.id, true);
    this._serverLoaded = true;
    this._loaded = true;
  }

  public deinit = async (): Promise<void> => {
    this._loaded = false;
    this._serverLoaded = false;
    app.threads.deinit();
    app.comments.deinit();
    app.reactions.deinit();
    console.log('Community stopped.');
  }
}

export default Community;
