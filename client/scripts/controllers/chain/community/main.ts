import { ICommunityAdapter } from 'models';
import m from 'mithril';
import { Coin } from 'adapters/currency';
import { CommentRefreshOption } from 'controllers/server/comments';
import $ from 'jquery';
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
    const response = await $.get(`${this.app.serverUrl()}/bulkOffchain`, {
      chain: null,
      community: this.id,
      jwt: this.app.user.jwt,
    });
    
    // If user is no longer on the initializing community, abort initialization
    if (this.meta.id !== m.route.params('scope')) {
      return false;
    }
    
    const { threads, comments, reactions, topics, admins, activeUsers } = response.result;
    this.app.threads.initialize(threads, true);
    this.app.comments.initialize(comments, true);
    this.app.reactions.initialize(reactions, true);
    this.app.topics.initialize(topics, true);
    this.meta.setAdmins(admins);
    this.app.recentActivity.setMostActiveUsers(activeUsers);
    this._serverLoaded = true;
    this._loaded = true;
    return true;
  }

  public deinit = async (): Promise<void> => {
    this._loaded = false;
    this._serverLoaded = false;
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.reactions.deinit();
    console.log(`${this.meta.name} stopped.`);
  }
}

export default Community;
