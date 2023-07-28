/* eslint-disable no-restricted-globals */
import axios from 'axios';
import { notifyError } from 'controllers/app/notifications';
import { EventEmitter } from 'events';
import $ from 'jquery';
import moment from 'moment';
import { Link } from 'server/models/thread';
import app from 'state';
import { ProposalStore, RecentListingStore } from 'stores';
/* eslint-disable no-restricted-syntax */
import Attachment from '../../models/Attachment';
import type ChainEntity from '../../models/ChainEntity';
import type MinimumProfile from '../../models/MinimumProfile';
import Poll from '../../models/Poll';
import Thread from '../../models/Thread';
import Topic from '../../models/Topic';

export const INITIAL_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE = 20;

/*

Threads are stored in two stores. One store, the listingStore, is responsible for all posts
rendered in the forum/community discussions listing (pages/discussions/index.tsx). It organizes
threads first by community, then by topic/stage or "subpage," using the const ALL_PROPOSALS_KEY to
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
by an id, then returns it after adding it to threads.store. These threads are *not* added
to the listingStore, since they do not belong in the listing component, and their presence
would break the listingStore's careful chronology.

*/

export interface VersionHistory {
  author?: MinimumProfile;
  timestamp: moment.Moment;
  body: string;
}

class ThreadsController {
  private static _instance: ThreadsController;
  public _store: ProposalStore<Thread>;
  public _listingStore: RecentListingStore;
  public _overviewStore: ProposalStore<Thread>;
  public isFetched = new EventEmitter();
  public isReactionFetched = new EventEmitter();

  private constructor() {
    this._store = new ProposalStore<Thread>();
    this._listingStore = new RecentListingStore();
    this._overviewStore = new ProposalStore<Thread>();
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public get store() {
    return this._store;
  }

  public get listingStore() {
    return this._listingStore;
  }

  public get overviewStore() {
    return this._overviewStore;
  }

  private _initialized = false;

  public get initialized() {
    return this._initialized;
  }

  public numVotingThreads: number;
  public numTotalThreads: number;
  private _resetPagination: boolean;

  public resetPagination() {
    this._resetPagination = true;
  }

  public getById(id: number) {
    return this._store.getByIdentifier(id);
  }

  public modelFromServer(thread) {
    const {
      id,
      title,
      body,
      last_edited,
      marked_as_spam_at,
      archived_at,
      locked_at,
      version_history,
      Attachments,
      created_at,
      updated_at,
      topic,
      kind,
      stage,
      chain,
      read_only,
      plaintext,
      url,
      pinned,
      collaborators,
      chain_entity_meta,
      has_poll,
      polls = [], // associated Polls
      reactions,
      last_commented_on,
      numberOfComments,
      canvasAction,
      canvasSession,
      canvasHash,
      links,
    } = thread;

    let { reactionIds, reactionType, addressesReacted } = thread;

    const attachments = Attachments
      ? Attachments.map((a) => new Attachment(a.url, a.description))
      : [];

    if (reactions) {
      reactionIds = reactions.map((r) => r.id);
      reactionType = reactions.map((r) => r?.type || r?.reaction);
      addressesReacted = reactions.map((r) => r?.address || r?.Address?.address);
    }

    let versionHistoryProcessed;
    if (version_history) {
      versionHistoryProcessed = version_history.map((v) => {
        if (!v) return;
        let history;
        try {
          history = JSON.parse(v);
          history.author =
            typeof history.author === 'string'
              ? JSON.parse(history.author)
              : typeof history.author === 'object'
                ? history.author
                : null;
          history.timestamp = moment(history.timestamp);
        } catch (e) {
          console.log(e);
        }
        return history;
      });
    }

    const chainEntitiesProcessed: ChainEntity[] = [];
    if (chain_entity_meta) {
      for (const meta of chain_entity_meta) {
        const full_entity = Array.from(app.chainEntities.store.values())
          .flat()
          .filter((e) => e.id === meta.ce_id)[0];
        if (full_entity) {
          if (meta.title) full_entity.title = meta.title;
          chainEntitiesProcessed.push(full_entity);
        }
      }
    }

    const lastEditedProcessed = last_edited
      ? moment(last_edited)
      : versionHistoryProcessed && versionHistoryProcessed?.length > 1
        ? versionHistoryProcessed[0].timestamp
        : null;

    const markedAsSpamAt = marked_as_spam_at ? moment(marked_as_spam_at) : null;
    const archivedAt = archived_at ? moment(archived_at) : null;

    let topicModel = null;
    const lockedAt = locked_at ? moment(locked_at) : null;
    if (topic?.id) {
      topicModel = new Topic(topic);
    }

    let decodedTitle;
    try {
      decodedTitle = decodeURIComponent(title);
    } catch (err) {
      console.error(`Could not decode title: "${title}"`);
      decodedTitle = title;
    }

    let decodedBody;
    try {
      decodedBody = decodeURIComponent(body);
    } catch (err) {
      console.error(`Could not decode body: "${body}"`);
      decodedBody = body;
    }

    const t = new Thread({
      id,
      author: thread.Address.address,
      authorChain: thread.Address.chain,
      title: decodedTitle,
      body: decodedBody,
      createdAt: moment(created_at),
      updatedAt: moment(updated_at),
      attachments,
      topic: topicModel,
      kind,
      stage,
      chain,
      readOnly: read_only,
      plaintext,
      url,
      pinned,
      collaborators,
      chainEntities: chainEntitiesProcessed,
      versionHistory: versionHistoryProcessed,
      lastEdited: lastEditedProcessed,
      markedAsSpamAt,
      lockedAt,
      hasPoll: has_poll,
      polls: polls.map((p) => new Poll(p)),
      lastCommentedOn: last_commented_on ? moment(last_commented_on) : null,
      numberOfComments,
      reactionIds,
      reactionType,
      addressesReacted,
      canvasAction,
      canvasSession,
      canvasHash,
      links,
    });

    return t;
  }

  public async setArchived(threadId: number, isArchived: boolean) {
    return new Promise((resolve, reject) => {
      $.post(
        `${app.serverUrl()}/threads/${threadId}/${!isArchived ? 'archive' : 'unarchive'
        }`,
        {
          jwt: app.user.jwt,
          chain_id: app.activeChainId(),
        }
      )
        .then((response) => {
          const foundThread = this.store.getByIdentifier(threadId);
          foundThread.archivedAt = response.result.archived_at;
          this.updateThreadInStore(new Thread({ ...foundThread }));
          resolve(foundThread);
        })
        .catch((e) => {
          console.error(e);
          notifyError(
            `Could not ${!isArchived ? 'archive' : 'unarchive'} thread`
          );
          reject(e);
        });
    });
  }

  public async updateThreadInStore(thread: Thread) {
    this._store.update(thread);
  }

  /**
   * Gets all threads associated with a link(ie all threads linked to 1 proposal)
   * @param args
   * @returns A list of resolved thread objects
   */
  public async getThreadsForLink({
    link,
  }: {
    link: Link;
  }): Promise<{ title: string; id: string }[]> {
    try {
      const response = await axios.post(`${app.serverUrl()}/linking/getLinks`, {
        link,
        jwt: app.user.jwt,
      });

      return response.data.result.threads;
    } catch (err) {
      notifyError('Could not get threads');
      console.log(err);
    }
  }

  public async fetchThreadsFromId(
    ids: Array<number | string>
  ): Promise<Thread[]> {
    const params = {
      chain: app.activeChainId(),
      thread_ids: ids,
    };
    const [response] = await Promise.all([
      axios.get(`${app.serverUrl()}/threads`, { params }),
      app.chainEntities.getRawEntities(app.activeChainId()),
    ]);
    if (response.data.status !== 'Success') {
      throw new Error(`Cannot fetch thread: ${response.status}`);
    }
    return response.data.result.map((rawThread) => {
      /**
       * rawThread has a different DS than the threads in store
       * here we will find if thread is in store and if so use most keys
       * of that data else if there is a valid key rawThread then it will
       * replace existing key from foundThread
      */
      const thread = this.modelFromServer(rawThread);
      const foundThread = this._store.getByIdentifier(thread.identifier);
      const finalThread = new Thread({
        ...((foundThread || {}) as any),
        ...((thread || {}) as any),
      });
      finalThread.associatedReactions = [
        ...(
          thread.associatedReactions.length > 0
            ? thread.associatedReactions
            : foundThread?.associatedReactions || []
        )
      ];
      finalThread.numberOfComments =
        rawThread?.numberOfComments || foundThread?.numberOfComments || 0;
      this._store.update(finalThread);
      if (foundThread) {
        this.numTotalThreads += 1;
      }

      // TODO Graham 4/24/22: This should happen automatically in thread modelFromServer
      return finalThread;
    });
  }

  public initialize(
    initialThreads = [],
    numVotingThreads,
    numTotalThreads,
    reset
  ) {
    if (reset) {
      this._store.clear();
      this._listingStore.clear();
    }

    for (const thread of initialThreads) {
      const modeledThread = this.modelFromServer(thread);
      if (!thread.Address) {
        console.error('Thread missing address');
      }
      try {
        this._listingStore.add(modeledThread);
      } catch (e) {
        console.error(e.message);
      }
    }
    this.numVotingThreads = numVotingThreads;
    this.numTotalThreads = numTotalThreads;
    this._initialized = true;
    this._resetPagination = true;
  }

  public deinit() {
    this._initialized = false;
    this._resetPagination = true;
    this._store.clear();
    this._listingStore.clear();
    this.numTotalThreads = 0;
  }
}

export default ThreadsController;
