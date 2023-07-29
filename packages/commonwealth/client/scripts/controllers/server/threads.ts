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
  public _listingStore: RecentListingStore;
  public _overviewStore: ProposalStore<Thread>;
  public isFetched = new EventEmitter();

  private constructor() {
    this._listingStore = new RecentListingStore();
    this._overviewStore = new ProposalStore<Thread>();
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
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

  public initialize(
    initialThreads = [],
    numVotingThreads,
    numTotalThreads,
    reset
  ) {
    if (reset) {
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
  }

  public deinit() {
    this._initialized = false;
    this._listingStore.clear();
    this.numTotalThreads = 0;
  }
}

export default ThreadsController;
