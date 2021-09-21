import { ICommunityAdapter } from 'models';
import m from 'mithril';
import { Coin } from 'adapters/currency';
import { CommentRefreshOption } from 'controllers/server/comments';
import $ from 'jquery';
import OffchainAccounts, { OffchainAccount } from './account';
import app from "state";
import {modelFromServer as modelThreadsUniqueAddressCount} from "controllers/server/threadUniqueAddressesCount";

class Community extends ICommunityAdapter<Coin, OffchainAccount> {
  private _loaded: boolean = false;
  public accounts: OffchainAccounts;

  get loaded() {
    return this._loaded;
  }

  private _serverLoaded: boolean = false;
  get serverLoaded() {
    return this._serverLoaded;
  }

  fetchChainData = async () => {
    return $.get(`${this.app.serverUrl()}/bulkOffchain`, {
      chain: null,
      community: this.id,
      jwt: this.app.user.jwt,
    });
  };

  public init = async () => {
    console.log(`Starting ${this.meta.name}`);
    this.accounts = new OffchainAccounts(this.app);
    const response = await this.fetchChainData();
    // If user is no longer on the initializing community, abort initialization
    // and return false, so that the invoking selectCommunity fn can similarly
    // break, rather than complete.
    if (
      this.meta.id !== (this.app.customDomainId() || m.route.param('scope'))
    ) {
      return false;
    }
    const { threads, topics, admins, activeUsers, numVotingThreads } = response.result;
    this.app.threads.initialize(threads, numVotingThreads, true);
    this.app.topics.initialize(topics, true);
    this.meta.setAdmins(admins);
    this.app.recentActivity.setMostActiveUsers(activeUsers);
    this._serverLoaded = true;
    this._loaded = true;
    return true;
  };

  public deinit = async (): Promise<void> => {
    this._loaded = false;
    this._serverLoaded = false;
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.reactions.deinit();
    this.app.reactionCounts.deinit();
    this.app.threadUniqueAddressesCount.deinit();
    console.log(`${this.meta.name} stopped.`);
  };
}

export default Community;
