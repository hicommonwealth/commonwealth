/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import moment from 'moment-twitter';
import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { ProposalStore, TopicScopedThreadStore } from 'stores';
import { OffchainThread, OffchainAttachment, CommunityInfo, NodeInfo, OffchainTopic } from 'models';

import { notifyError } from 'controllers/app/notifications';
import { updateLastVisited } from 'controllers/app/login';
import { modelFromServer as modelCommentFromServer } from 'controllers/server/comments';

export const modelFromServer = (thread) => {
  const attachments = thread.OffchainAttachments
    ? thread.OffchainAttachments.map((a) => new OffchainAttachment(a.url, a.description))
    : [];
  return new OffchainThread(
    thread.Address.address,
    decodeURIComponent(thread.title),
    attachments,
    thread.id,
    moment(thread.created_at),
    thread.topic,
    thread.kind,
    thread.version_history,
    thread.community,
    thread.chain,
    thread.read_only,
    decodeURIComponent(thread.body),
    thread.url,
    thread.Address.chain,
    thread.pinned,
  );
};

class ThreadsController {
  private _store = new ProposalStore<OffchainThread>();
  private _topicListingStore = new TopicScopedThreadStore();

  public get store() { return this._store; }
  public get topicListingStore() { return this._topicListingStore; }

  private _initialized = false;

  public get initialized() { return this._initialized; }

  public getType(primary: string, secondary?: string, tertiary?: string) {
    const result = this._store.getAll().filter((thread) => {
      return tertiary
        ? thread.kind === primary || thread.kind === secondary || thread.kind === tertiary
        : secondary
          ? thread.kind === primary || thread.kind === secondary
          : thread.kind === primary;
    });
    return result;
  }

  public async create(
    address: string,
    kind: string,
    chainId: string,
    communityId: string,
    title: string,
    topicName: string,
    topicId: number,
    body?: string,
    url?: string,
    attachments?: string[],
    mentions?: string[],
    readOnly?: boolean
  ) {
    const timestamp = moment();
    const firstVersion : any = { timestamp, body };
    const versionHistory : string = JSON.stringify(firstVersion);

    try {
      // TODO: Change to POST /thread
      const response = await $.post(`${app.serverUrl()}/createThread`, {
        'author_chain': app.user.activeAccount.chain.id,
        'chain': chainId,
        'community': communityId,
        'address': address,
        'title': encodeURIComponent(title),
        'body': encodeURIComponent(body),
        'kind': kind,
        'versionHistory': versionHistory,
        'attachments[]': attachments,
        'mentions[]': mentions,
        'topic_name': topicName,
        'topic_id': topicId,
        'url': url,
        'readOnly': readOnly,
        'jwt': app.user.jwt,
      });
      const result = modelFromServer(response.result);
      this._store.add(result);
      // New posts are added to both the topic and allProposals sub-store
      const storeOptions = { allProposals: true, exclusive: false };
      this._topicListingStore.add(result, storeOptions);
      app.recentActivity.addThreads([{
        id: response.result.id,
        Address: response.result.Address,
        title: response.result.title,
        created_at: response.result.created_at,
        community: response.result.community,
        chain: response.result.chain,
        topic: response.result.topic,
        pinned: response.result.pinned,
        url: response.result.pinned
      }]);
      app.recentActivity.addAddressesFromActivity([response.result]);
      const activeEntity = app.activeCommunityId() ? app.community : app.chain;
      updateLastVisited(app.activeCommunityId()
        ? (activeEntity.meta as CommunityInfo)
        : (activeEntity.meta as NodeInfo).chain, true);
      return result;
    } catch (err) {
      console.log('Failed to create thread');
      throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
        : 'Failed to create thread');
    }
  }

  public async edit(
    proposal: OffchainThread,
    body?: string,
    title?: string,
    attachments?: string[],
  ) {
    const newBody = body || proposal.body;
    const newTitle = title || proposal.title;
    const recentEdit : any = { timestamp: moment(), body };
    const versionHistory = JSON.stringify(recentEdit);
    await $.ajax({
      url: `${app.serverUrl()}/editThread`,
      type: 'PUT',
      data: {
        'thread_id': proposal.id,
        'kind': proposal.kind,
        'body': encodeURIComponent(newBody),
        'title': newTitle,
        'version_history': versionHistory,
        'attachments[]': attachments,
        'jwt': app.user.jwt
      },
      success: (response) => {
        const result = modelFromServer(response.result);
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._topicListingStore.update(result);
        return result;
      },
      error: (err) => {
        console.log('Failed to edit thread');
        throw new Error((err.responseJSON && err.responseJSON.error) ? err.responseJSON.error
          : 'Failed to edit thread');
      }
    });
  }

  public async delete(proposal) {
    const _this = this;
    return new Promise((resolve, reject) => {
      // TODO: Change to DELETE /thread
      $.post(`${app.serverUrl()}/deleteThread`, {
        'jwt': app.user.jwt,
        'thread_id': proposal.id,
      }).then((result) => {
        // Deleted posts are removed from all stores containing them
        this.store.remove(proposal);
        this._topicListingStore.remove(proposal);
        app.recentActivity.removeThread(proposal.id, proposal.community || proposal.chain);
        // Properly removing from recent activity will require comments/threads to have an address_id
        // app.recentActivity.removeAddressActivity([proposal]);
        m.redraw();
        resolve(result);
      }).catch((e) => {
        console.error(e);
        notifyError('Could not delete thread');
        reject(e);
      });
    });
  }

  public async setPrivacy(args: { threadId: number, readOnly: boolean, }) {
    return $.ajax({
      url: `${app.serverUrl()}/setPrivacy`,
      type: 'POST',
      data: {
        'jwt': app.user.jwt,
        'thread_id': args.threadId,
        'read_only': args.readOnly,
      },
      success: (response) => {
        const result = modelFromServer(response.result);
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._topicListingStore.update(result);
        return result;
      },
      error: (err) => {
        notifyError('Could not update thread read_only');
        console.error(err);
      },
    });
  }

  public async pin(args: {proposal: OffchainThread, }) {
    return $.ajax({
      url: `${app.serverUrl()}/pinThread`,
      type: 'POST',
      data: {
        'jwt': app.user.jwt,
        'thread_id': args.proposal.id,
      },
      success: (response) => {
        const result = modelFromServer(response.result);
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._topicListingStore.update(result);
        return result;
      },
      error: (err) => {
        notifyError('Could not update pinned state');
        console.error(err);
      }
    });
  }

  public async fetchThread(id) {
    const params = {
      chain: app.activeChainId(),
      community: app.activeCommunityId(),
      id,
    };
    const response = await $.get(`${app.serverUrl()}/getThread`, params);
    if (response.status !== 'Success') {
      throw new Error(`Unsuccessful refresh status: ${response.status}`);
    }
    const thread = modelFromServer(response.result);
    const existing = this._store.getByIdentifier(thread.id);
    if (existing) this._store.remove(existing);
    this._store.update(thread);
    return modelFromServer(response.result);
  }

  // loadNextPage returns false if there are no more threads to load
  public async loadNextPage(options: {
    chainId: string,
    communityId: string,
    cutoffDate: moment.Moment,
    pageSize?: number,
    topicId?: OffchainTopic
  }) : Promise<boolean> {
    const { chainId, communityId, cutoffDate, topicId } = options;
    const pageSize = options.pageSize || 20;
    const params = {
      chain: chainId,
      community: communityId,
      cutoff_date: cutoffDate.toISOString(),
      page_size: pageSize,
    };
    if (topicId) params['topic_id'] = topicId;
    const response = await $.get(`${app.serverUrl()}/bulkThreads`, params);
    if (response.status !== 'Success') {
      throw new Error(`Unsuccessful refresh status: ${response.status}`);
    }
    console.log(response.result.threads.length);
    const threads = (app.chain)
      ? response.result.threads.filter((thread) => !thread.community)
      : response.result.threads;
    console.log(threads.length);
    const comments = (app.chain)
      ? response.result.comments.filter((comment) => !comment.community)
      : response.result.comments;
    for (const thread of threads) {
      const modeledThread = modelFromServer(thread);
      if (!thread.Address) {
        console.error('OffchainThread missing address');
      }
      try {
        const storeOptions = {
          allProposals: !topicId,
          exclusive: true
        };
        this._store.add(modeledThread);
        this._topicListingStore.add(modeledThread, storeOptions);
      } catch (e) {
        console.error(e.message);
      }
    }
    for (const comment of comments) {
      const existing = app.comments.store.getById(comment.id);
      if (existing) {
        app.comments.store.remove(existing);
      }
      try {
        app.comments.store.add(modelCommentFromServer(comment));
      } catch (e) {
        console.error(e.message);
      }
    }

    // Each bulkThreads call that is passed a cutoff_date param limits its query to
    // the most recent X posts before that date. That count, X, is determined by the pageSize param.
    // If a query returns less than X posts, it is 'exhausted'; there are no more db entries that match
    // the call's params. By returning a boolean, the discussion listing can determine whether
    // it should continue calling the loadNextPage fn on scroll, or else notify the user that all
    // relevant listing threads have been exhausted.
    return !(threads.length < pageSize);
  }

  public refreshAll(chainId: string, communityId: string, reset = false) {
    // TODO: Change to GET /threads
    return $.get(`${app.serverUrl()}/bulkThreads`, {
      chain: chainId,
      community: communityId,
    })
      .then((response) => {
        if (response.status !== 'Success') {
          throw new Error(`Unsuccessful refresh status: ${response.status}`);
        }
        if (reset) {
          this._store.clear();
        }
        // Threads that are posted in an offchain community are still linked to a chain / author address,
        // so when we want just chain threads, then we have to filter away those that have a community
        const threads = (app.chain) ? response.result.threads.filter((thread) => !thread.community) : response.result.threads;

        for (const thread of threads) {
          // TODO: OffchainThreads should always have a linked Address
          if (!thread.Address) {
            console.error('OffchainThread missing address');
          }
          // TODO: check `response` against store and update store iff `response` is newer
          const existing = this._store.getByIdentifier(thread.id);
          if (existing) {
            this._store.remove(existing);
          }
          try {
            this._store.add(modelFromServer(thread));
          } catch (e) {
            console.error(e.message);
          }
        }
        this._initialized = true;
      }, (err) => {
        console.log('failed to load offchain discussions');
        throw new Error((err.responseJSON && err.responseJSON.error)
          ? err.responseJSON.error
          : 'Error loading offchain discussions');
      });
  }

  public initialize(initialThreads: any[], reset = true) {
    if (reset) {
      this._store.clear();
      this._topicListingStore.clear();
    }
    for (const thread of initialThreads) {
      const modeledThread = modelFromServer(thread);
      if (!thread.Address) {
        console.error('OffchainThread missing address');
      }
      try {
        this._store.add(modeledThread);
        // Initialization only populates AllProposals and pinned
        const options = { allProposals: true, exclusive: !modeledThread.pinned };
        this._topicListingStore.add(modeledThread, options);
      } catch (e) {
        console.error(e.message);
      }
    }
    this._initialized = true;
  }

  public deinit() {
    this._initialized = false;
    this._store.clear();
    this._topicListingStore.clear();
  }
}

export default ThreadsController;
