import { CommunityInfo, ICommunityAdapter } from 'models';
import $ from 'jquery';

import { Coin } from 'adapters/currency';
import { CommentRefreshOption } from 'controllers/server/comments';
import OffchainAccounts, { OffchainAccount } from './account';

class Community extends ICommunityAdapter<Coin, OffchainAccount> {
  private _loaded: boolean = false;
  public accounts: OffchainAccounts;

  get loaded() { return this._loaded; }

  private _serverLoaded: boolean = false;
  get serverLoaded() { return this._serverLoaded; }

  public init = async () => {
    console.log(`Starting ${this.meta.name}`);
    this.accounts = new OffchainAccounts(this.app);
    await this.app.threads.refreshAll(null, this.id, true);
    await this.app.comments.refreshAll(null, this.id, CommentRefreshOption.ResetAndLoadOffchainComments);
    await this.app.reactions.refreshAll(null, this.id, true);
    await this.app.tags.refreshAll(null, this.id, true);
    await $.get(`${this.app.serverUrl()}/bulkMembers`, { community: this.id, })
      .then((res) => {
        const roles = res.result.filter((r) => { return r.permission === 'admin' || r.permission === 'moderator'; });
        this.app.community.meta.setAdmins(roles);
      }).catch(() => console.log('Failed to fetch admins/mods'));
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
