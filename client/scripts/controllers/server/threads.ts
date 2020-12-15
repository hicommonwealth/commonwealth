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

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

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

/*

Threads are stored in two stores. One store, the listingStore, is responsible for all posts
rendered in the forum/community discussions listing (pages/discussions/index.ts). It organizes
threads first by community, then by topic or "subpage," using the const ALL_PROPOSALS_KEY to
store non-topic-sorted threads for the main discussion listing. The relevant sub-store, for a
given discussion listing, can be accessed via getStoreByCommunityAndTopic, again passing
ALL_PROPOSALS_KEY for all proposals.

The second store, "store", is a standard ProposalStore. All fetched threads are added to it,
regardless of whether they belong on a given listing.

Threads are fetched in several ways depending on context. On chain or community initialization,
/bulkOffchain is called directly from the init page (bypassing the threads controller) and
fetching the most recent 20 posts for that chain/community (including pinned posts). As a user
scrolls through the discussions listing, the onscroll listener continuously calls the controller
fn loadNextPage, passing a "cutoff date"—the date of the least recently active thread thus far
rendered on the listing—and receiving the next page worth of threads (typically the next 20).

When a user navigates to a proposal page that has not been fetched through these bulk calls,
the proposal component calls the controller fetchThread fn, which fetches an individual thread
by an id, then returns it after addinig it to threads.store. These threads are *not* added
to the listingStore, since they do not belong in the listing component, and their presence
would break the listingStore's careful chronology.

*/

class ThreadsController {
  private _store = new ProposalStore<OffchainThread>();
  private _listingStore = new TopicScopedThreadStore();

  public get store() { return this._store; }
  public get listingStore() { return this._listingStore; }

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
      this._listingStore.add(result, storeOptions);
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
        this._listingStore.update(result);
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
        this._listingStore.remove(proposal);
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
        this._listingStore.update(result);
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
        this._listingStore.update(result);
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
      throw new Error(`Cannot fetch thread: ${response.status}`);
    }
    const thread = modelFromServer(response.result);
    const existing = this._store.getByIdentifier(thread.id);
    if (existing) this._store.remove(existing);
    this._store.update(thread);
    return thread;
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
    // pageSize can not exceed 50
    const pageSize = options.pageSize
      ? Math.min(options.pageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
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
    const { threads, comments } = response.result;
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
        this._listingStore.add(modeledThread, storeOptions);
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
        const { threads } = response.result;

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
      this._listingStore.clear();
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
        this._listingStore.add(modeledThread, options);
      } catch (e) {
        console.error(e.message);
      }
    }
    this._initialized = true;
  }

  public deinit() {
    this._initialized = false;
    this._store.clear();
    this._listingStore.clear();
  }
}

export default ThreadsController;
