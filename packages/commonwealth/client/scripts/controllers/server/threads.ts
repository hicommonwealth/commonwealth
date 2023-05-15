/* eslint-disable no-restricted-globals */
import { NotificationCategories } from 'common-common/src/types';
import { updateLastVisited } from 'controllers/app/login';

import { notifyError } from 'controllers/app/notifications';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { modelFromServer as modelReactionFromServer } from 'controllers/server/reactions';
import $ from 'jquery';
/* eslint-disable no-restricted-syntax */

import Attachment from '../../models/Attachment';
import type ChainEntity from '../../models/ChainEntity';
import type MinimumProfile from '../../models/MinimumProfile';
import NotificationSubscription from '../../models/NotificationSubscription';
import Poll from '../../models/Poll';
import Thread from '../../models/Thread';
import type Topic from '../../models/Topic';
import { ThreadStage } from '../../models/types';
import moment from 'moment';

import app from 'state';
import { ProposalStore, RecentListingStore } from 'stores';
import { orderDiscussionsbyLastComment } from 'views/pages/discussions/helpers';
import { EventEmitter } from 'events';
import { Link, LinkSource } from 'server/models/thread';
import axios from 'axios';

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
  private readonly _store: ProposalStore<Thread>;
  private readonly _listingStore: RecentListingStore;
  private readonly _overviewStore: ProposalStore<Thread>;
  public isFetched = new EventEmitter();

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
      version_history,
      Attachments,
      created_at,
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
      for (const reaction of reactions) {
        app.reactions.store.add(modelReactionFromServer(reaction));
      }
      reactionIds = reactions.map((r) => r.id);
      reactionType = reactions.map((r) => r.type);
      addressesReacted = reactions.map((r) => r.address);
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

    let topicFromStore = null;
    if (topic?.id) {
      topicFromStore = app.topics.store.getById(topic.id);
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
      attachments,
      topic: topicFromStore,
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

    ThreadsController.Instance.store.add(t);

    return t;
  }

  public async create(
    address: string,
    kind: string,
    stage: string,
    chainId: string,
    title: string,
    topic: Topic,
    body?: string,
    url?: string,
    attachments?: string[],
    readOnly?: boolean
  ) {
    try {
      // TODO: Change to POST /thread
      const {
        action = null,
        session = null,
        hash = null,
      } = await app.sessions.signThread({
        community: chainId,
        title,
        body,
        link: url,
        topic: topic.id,
      });
      const response = await $.post(`${app.serverUrl()}/createThread`, {
        author_chain: app.user.activeAccount.chain.id,
        author: JSON.stringify(app.user.activeAccount.profile),
        chain: chainId,
        address,
        title: encodeURIComponent(title),
        body: encodeURIComponent(body),
        kind,
        stage,
        'attachments[]': attachments,
        topic_name: topic.name,
        topic_id: topic.id,
        url,
        readOnly,
        jwt: app.user.jwt,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
      });
      const result = this.modelFromServer(response.result);

      // Update stage counts
      if (result.stage === ThreadStage.Voting) this.numVotingThreads++;

      // New posts are added to both the topic and allProposals sub-store
      this.store.add(result);
      this.numTotalThreads += 1;
      this._listingStore.add(result);
      const activeEntity = app.chain;
      updateLastVisited(activeEntity.meta, true);

      // synthesize new subscription rather than hitting backend
      const subscriptionJSON = {
        id: null,
        category_id: NotificationCategories.NewComment,
        object_id: `discussion_${result.id}`,
        is_active: true,
        created_at: Date.now(),
        immediate_email: false,
        chain_id: result.chain,
        offchain_thread_id: result.id,
      };
      app.user.notifications.subscriptions.push(
        NotificationSubscription.fromJSON(subscriptionJSON)
      );
      return result;
    } catch (err) {
      console.log('Failed to create thread');
      throw new Error(
        err.responseJSON && err.responseJSON.error
          ? err.responseJSON.error
          : err.message
          ? err.message
          : 'Failed to create thread'
      );
    }
  }

  public async edit(
    proposal: Thread,
    body: string,
    title: string,
    url?: string,
    attachments?: string[]
  ) {
    const newBody = body || proposal.body;
    const newTitle = title || proposal.title;
    const {
      action = null,
      session = null,
      hash = null,
    } = await app.sessions.signThread({
      community: app.activeChainId(),
      title: newTitle,
      body: newBody,
      link: url,
      topic: proposal.topic.id,
    });

    await $.ajax({
      url: `${app.serverUrl()}/editThread`,
      type: 'PUT',
      data: {
        author_chain: app.user.activeAccount.chain.id,
        author: JSON.stringify(app.user.activeAccount.profile),
        address: app.user.activeAccount.address,
        chain: app.activeChainId(),
        thread_id: proposal.id,
        kind: proposal.kind,
        stage: proposal.stage,
        body: encodeURIComponent(newBody),
        title: encodeURIComponent(newTitle),
        url,
        'attachments[]': attachments,
        jwt: app.user.jwt,
        canvas_action: action,
        canvas_session: session,
        canvas_hash: hash,
      },
      success: (response) => {
        const result = this.modelFromServer(response.result);
        // Update counters
        if (proposal.stage === ThreadStage.Voting) this.numVotingThreads--;
        if (result.stage === ThreadStage.Voting) this.numVotingThreads++;
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._listingStore.add(result);
        return result;
      },
      error: (err) => {
        console.log('Failed to edit thread');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to edit thread'
        );
      },
    });
  }

  public async delete(proposal) {
    return new Promise((resolve, reject) => {
      // TODO: Change to DELETE /thread
      $.post(`${app.serverUrl()}/deleteThread`, {
        jwt: app.user.jwt,
        thread_id: proposal.id,
        chain_id: app.activeChainId(),
      })
        .then((result) => {
          // Deleted posts are removed from all stores containing them
          this.store.remove(proposal);
          this._listingStore.remove(proposal);
          this._overviewStore.remove(proposal);
          this.numTotalThreads -= 1;
          resolve(result);
        })
        .catch((e) => {
          console.error(e);
          notifyError('Could not delete thread');
          reject(e);
        });
    });
  }

  public async setStage(args: { threadId: number; stage: ThreadStage }) {
    await $.ajax({
      url: `${app.serverUrl()}/updateThreadStage`,
      type: 'POST',
      data: {
        chain: app.activeChainId(),
        thread_id: args.threadId,
        stage: args.stage,
        jwt: app.user.jwt,
      },
      success: (response) => {
        const result = this.modelFromServer(response.result);
        // Update counters
        if (args.stage === ThreadStage.Voting) this.numVotingThreads--;
        if (result.stage === ThreadStage.Voting) this.numVotingThreads++;
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._listingStore.add(result);
        app.threadUpdateEmitter.emit('threadUpdated', {});
        return result;
      },
      error: (err) => {
        console.log('Failed to update stage');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to update stage'
        );
      },
    });
  }

  public async setPrivacy(args: { threadId: number; readOnly: boolean }) {
    return $.ajax({
      url: `${app.serverUrl()}/updateThreadPrivacy`,
      type: 'POST',
      data: {
        jwt: app.user.jwt,
        thread_id: args.threadId,
        read_only: args.readOnly,
      },
      success: (response) => {
        const result = this.modelFromServer(response.result);
        // Post edits propagate to all thread stores
        this._listingStore.add(result);
        this._overviewStore.update(result);
        return result;
      },
      error: (err) => {
        notifyError('Could not update thread read_only');
        console.error(err);
      },
    });
  }

  public async pin(args: { proposal: Thread }) {
    return $.ajax({
      url: `${app.serverUrl()}/updateThreadPinned`,
      type: 'POST',
      data: {
        jwt: app.user.jwt,
        thread_id: args.proposal.id,
      },
      success: (response) => {
        const result = this.modelFromServer(response.result);
        // Post edits propagate to all thread stores
        this._listingStore.add(result);
        return result;
      },
      error: (err) => {
        notifyError('Could not update pinned state');
        console.error(err);
      },
    });
  }
  /**
   * Add a set of links to a Thread
   * @param args
   * @returns updated Thread
   */
  public async addLinks({
    threadId,
    links,
  }: {
    threadId: number;
    links: Link[];
  }): Promise<Thread> {
    try {
      const response = await axios.post(
        `${app.serverUrl()}/linking/addThreadLinks`,
        {
          thread_id: threadId,
          links,
          jwt: app.user.jwt,
        }
      );

      const updatedThread = this.modelFromServer(response.data.result);
      this._listingStore.remove(updatedThread);
      this._listingStore.add(updatedThread);
      app.threadUpdateEmitter.emit('threadUpdated', {});

      return response.data.result;
    } catch (err) {
      console.log('Could not add links', err);
      throw new Error(err);
    }
  }

  /**
   * Deletes a set of Links
   * @param args
   * @returns updated Thread
   */
  public async deleteLinks({
    threadId,
    links,
  }: {
    threadId: number;
    links: Link[];
  }): Promise<Thread> {
    try {
      const response = await axios.delete(
        `${app.serverUrl()}/linking/deleteLinks`,
        {
          data: {
            thread_id: threadId,
            links,
            jwt: app.user.jwt,
          },
        }
      );

      const updatedThread = this.modelFromServer(response.data.result);
      this._listingStore.remove(updatedThread);
      this._listingStore.add(updatedThread);
      app.threadUpdateEmitter.emit('threadUpdated', {});

      return response.data.result;
    } catch (err) {
      console.log('Could not delete links', err);
      throw new Error(err);
    }
  }

  /**
   * Gets all links or filtered by linkType for a thread id
   * @param args
   * @returns list of resolved links using adapters + link object
   */
  public async getLinksForThread({
    threadId,
    linkType,
    link,
  }: {
    threadId: number;
    linkType?: LinkSource[];
    link?: Link;
  }): Promise<string[]> {
    try {
      const response = await axios.post(`${app.serverUrl()}/linking/getLinks`, {
        thread_id: threadId,
        linkType,
        link,
        jwt: app.user.jwt,
      });

      return response.data;
    } catch (err) {
      notifyError('Could not get links');
      console.log(err);
    }
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
      ids: ids.filter(Boolean),
    };
    const [response] = await Promise.all([
      $.get(`${app.serverUrl()}/getThreads`, params),
      app.chainEntities.getRawEntities(app.activeChainId()),
    ]);
    if (response.status !== 'Success') {
      throw new Error(`Cannot fetch thread: ${response.status}`);
    }
    return response.result.map((rawThread) => {
      const thread = this.modelFromServer(rawThread);
      const existing = this._store.getByIdentifier(thread.id);
      if (existing) this._store.remove(existing);
      else {
        this._store.update(thread);
        this.numTotalThreads += 1;
      }
      // TODO Graham 4/24/22: This should happen automatically in thread modelFromServer
      this.fetchReactionsCount([thread]);
      return thread;
    });
  }

  // TODO Graham 4/24/22: Should this method be in reactionCounts controller?
  // TODO Graham 4/24/22: All "ReactionsCount" names need renaming to "ReactionCount" (singular)
  // TODO Graham 4/24/22: All of JB's AJAX requests should be swapped out for .get and .post reqs
  fetchReactionsCount = async (threads) => {
    const { result: reactionCounts } = await $.ajax({
      type: 'POST',
      url: `${app.serverUrl()}/reactionsCounts`,
      headers: {
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        thread_ids: threads.map((thread) => thread.id),
        active_address: app.user.activeAccount?.address,
      }),
    });

    for (const rc of reactionCounts) {
      const id = app.reactionCounts.store.getIdentifier({
        threadId: rc.thread_id,
        proposalId: rc.proposal_id,
        commentId: rc.comment_id,
      });
      const existing = app.reactionCounts.store.getById(id);
      if (existing) {
        app.reactionCounts.store.remove(existing);
      }
      try {
        app.reactionCounts.store.add(
          modelReactionCountFromServer({ ...rc, id })
        );
      } catch (e) {
        console.error(e.message);
      }
    }
  };

  public async loadNextPage(options: {
    topicName?: string;
    stageName?: string;
    includePinnedThreads?: boolean;
  }) {
    // Used to reset pagination when switching between topics
    if (this._resetPagination) {
      this.listingStore.clear();
      this._resetPagination = false;
    }

    if (this.listingStore.isDepleted(options)) {
      return;
    }
    const { topicName, stageName, includePinnedThreads } = options;
    const chain = app.activeChainId();
    const params = {
      chain,
      cutoff_date: this.listingStore.isInitialized(options)
        ? this.listingStore.getCutoffDate(options).toISOString()
        : moment().toISOString(),
    };
    const topicId = app.topics.getByName(topicName, chain)?.id;

    if (topicId) params['topic_id'] = topicId;
    if (stageName) params['stage'] = stageName;
    if (includePinnedThreads) params['includePinnedThreads'] = true;

    // fetch threads and refresh entities so we can join them together
    const [response] = await Promise.all([
      $.get(`${app.serverUrl()}/bulkThreads`, params),
      // app.chainEntities.getRawEntities(chain),
    ]);
    if (response.status !== 'Success') {
      throw new Error(`Unsuccessful refresh status: ${response.status}`);
    }
    const { threads } = response.result;
    // TODO: edit this process to include ChainEntityMeta data + match it with the actual entity
    const modeledThreads: Thread[] = threads.map((t) => {
      return this.modelFromServer(t);
    });

    app.threadReactions.refreshReactionsFromThreads(modeledThreads);

    modeledThreads.forEach((thread) => {
      try {
        this._store.add(thread);
        this._listingStore.add(thread);
      } catch (e) {
        console.error(e.message);
      }
    });

    // Update listing cutoff date (date up to which threads have been fetched)
    const unPinnedThreads = modeledThreads.filter((t) => !t.pinned);
    if (modeledThreads?.length) {
      const lastThread = unPinnedThreads.sort(orderDiscussionsbyLastComment)[
        unPinnedThreads.length - 1
      ];

      if (lastThread) {
        const cutoffDate = lastThread.lastCommentedOn || lastThread.createdAt;
        this.listingStore.setCutoffDate(options, cutoffDate);
      }
    }

    await Promise.all([
      this.fetchReactionsCount(threads),
      app.threadUniqueAddressesCount.fetchThreadsUniqueAddresses({
        threads,
        chain,
      }),
    ]);

    if (!this.listingStore.isInitialized(options)) {
      this.listingStore.initializeListing(options);
    }
    if (
      (includePinnedThreads ? threads.length : unPinnedThreads.length) <
      DEFAULT_PAGE_SIZE
    ) {
      this.listingStore.depleteListing(options);
    }

    return modeledThreads;
  }

  public async getThreadCommunityId(threadId: string) {
    try {
      const response = await axios.get(`${app.serverUrl()}/getThreads`, {
        params: {
          ids: [threadId],
        },
      });

      const thread = response['data']['result'][0];
      return thread;
    } catch (e) {
      return null;
    }
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
