/* eslint-disable no-restricted-globals */
/* eslint-disable no-restricted-syntax */
import _ from 'lodash';
import moment from 'moment';
import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { ProposalStore, RecentListingStore } from 'stores';
import {
  Thread,
  Attachment,
  ThreadStage,
  NodeInfo,
  Profile,
  ChainEntity,
  NotificationSubscription,
  Poll,
  Topic,
} from 'models';
import { NotificationCategories } from 'common-common/src/types';

import { notifyError } from 'controllers/app/notifications';
import { updateLastVisited } from 'controllers/app/login';
import { modelFromServer as modelReactionFromServer } from 'controllers/server/reactions';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { LinkedThreadAttributes } from 'server/models/linked_thread';
import { orderDiscussionsbyLastComment } from 'views/pages/discussions/helpers';
export const INITIAL_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE = 20;

export const modelFromServer = (thread) => {
  const {
    id,
    title,
    body,
    last_edited,
    version_history,
    snapshot_proposal,
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
    chain_entities,
    ChainEntities,
    has_poll,
    polls = [], // associated Polls
    reactions,
    last_commented_on,
    linked_threads,
  } = thread;

  const attachments = Attachments
    ? Attachments.map((a) => new Attachment(a.url, a.description))
    : [];

  if (reactions) {
    for (const reaction of reactions) {
      app.reactions.store.add(modelReactionFromServer(reaction));
    }
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

  let chainEntitiesProcessed: ChainEntity[];
  if (chain_entities && !ChainEntities) {
    chainEntitiesProcessed = chain_entities.map((c) => {
      return {
        id: c.id,
        chain,
        type: c.type,
        typeId: c.type_id || c.typeId,
      };
    });
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

  const linkedThreads = (linked_threads || []).map(
    (lT: LinkedThreadAttributes) => ({
      linkedThread: lT.linked_thread,
      linkingThread: lT.linking_thread,
    })
  );

  return new Thread({
    id,
    author: thread.Address.address,
    authorChain: thread.Address.chain,
    title: decodedTitle,
    body: decodedBody,
    createdAt: moment(created_at),
    attachments,
    snapshotProposal: snapshot_proposal,
    topic: topicFromStore,
    kind,
    stage,
    chain,
    readOnly: read_only,
    plaintext,
    url,
    pinned,
    collaborators,
    chainEntities: chainEntitiesProcessed || ChainEntities,
    versionHistory: versionHistoryProcessed,
    lastEdited: lastEditedProcessed,
    hasPoll: has_poll,
    polls: polls.map((p) => new Poll(p)),
    lastCommentedOn: last_commented_on ? moment(last_commented_on) : null,
    linkedThreads,
  });
};

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
by an id, then returns it after addinig it to threads.store. These threads are *not* added
to the listingStore, since they do not belong in the listing component, and their presence
would break the listingStore's careful chronology.

*/

export interface VersionHistory {
  author?: Profile;
  timestamp: moment.Moment;
  body: string;
}

class ThreadsController {
  private _store = new ProposalStore<Thread>();
  private _listingStore: RecentListingStore = new RecentListingStore();
  private _overviewStore = new ProposalStore<Thread>();

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

  public getType(primary: string, secondary?: string, tertiary?: string) {
    const result = this._store.getAll().filter((thread) => {
      return tertiary
        ? thread.kind === primary ||
            thread.kind === secondary ||
            thread.kind === tertiary
        : secondary
        ? thread.kind === primary || thread.kind === secondary
        : thread.kind === primary;
    });
    return result;
  }

  public getById(id: number) {
    return this._store.getByIdentifier(id);
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
      });
      const result = modelFromServer(response.result);
      this._store.add(result);

      // Update stage counts
      if (result.stage === ThreadStage.Voting) this.numVotingThreads++;

      // New posts are added to both the topic and allProposals sub-store
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
        title: newTitle,
        url,
        'attachments[]': attachments,
        jwt: app.user.jwt,
      },
      success: (response) => {
        const result = modelFromServer(response.result);
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
          m.redraw();
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
        const result = modelFromServer(response.result);
        // Update counters
        if (args.stage === ThreadStage.Voting) this.numVotingThreads--;
        if (result.stage === ThreadStage.Voting) this.numVotingThreads++;
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._listingStore.update(result);
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
        const result = modelFromServer(response.result);
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._listingStore.update(result);
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
        const result = modelFromServer(response.result);
        // Post edits propagate to all thread stores
        this._store.update(result);
        this._listingStore.update(result);
        return result;
      },
      error: (err) => {
        notifyError('Could not update pinned state');
        console.error(err);
      },
    });
  }

  public async setLinkedSnapshotProposal(args: {
    threadId: number;
    snapshotProposal: string;
  }) {
    await $.ajax({
      url: `${app.serverUrl()}/updateThreadLinkedSnapshotProposal`,
      type: 'POST',
      data: {
        chain: app.activeChainId(),
        thread_id: args.threadId,
        snapshot_proposal: args.snapshotProposal,
        jwt: app.user.jwt,
      },
      success: () => {
        const thread = this._store.getByIdentifier(args.threadId);
        if (!thread) return;
        thread.snapshotProposal = args.snapshotProposal;
        return thread;
      },
      error: (err) => {
        console.log('Failed to update linked snapshot proposal');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to update linked proposals'
        );
      },
    });
  }

  public async setLinkedChainEntities(args: {
    threadId: number;
    entities: ChainEntity[];
  }) {
    const { threadId, entities } = args;
    await $.ajax({
      url: `${app.serverUrl()}/updateThreadLinkedChainEntities`,
      type: 'POST',
      data: {
        chain: app.activeChainId(),
        thread_id: threadId,
        chain_entity_id: entities.map((ce) => ce.id),
        jwt: app.user.jwt,
      },
      success: () => {
        const thread = this._store.getByIdentifier(threadId);
        if (!thread) return;
        thread.chainEntities.splice(0);
        entities.forEach((ce) =>
          thread.chainEntities.push({
            id: ce.id,
            type: ce.type,
            typeId: ce.typeId,
            chain: thread.chain,
          })
        );
        return thread;
      },
      error: (err) => {
        console.log('Failed to update linked proposals');
        throw new Error(
          err.responseJSON && err.responseJSON.error
            ? err.responseJSON.error
            : 'Failed to update linked proposals'
        );
      },
    });
  }

  public async addLinkedThread(
    linkingThreadId: number,
    linkedThreadId: number
  ) {
    const response = await $.post(`${app.serverUrl()}/updateLinkedThreads`, {
      chain: app.activeChainId(),
      linking_thread_id: linkingThreadId,
      linked_thread_id: linkedThreadId,
      address: app.user.activeAccount.address,
      author_chain: app.user.activeAccount.chain.id,
      jwt: app.user.jwt,
    });
    if (response.status !== 'Success') {
      throw new Error();
    }
    this._store.add(modelFromServer(response.result));
  }

  public async removeLinkedThread(
    linkingThreadId: number,
    linkedThreadId: number
  ) {
    const response = await $.post(`${app.serverUrl()}/updateLinkedThreads`, {
      chain: app.activeChainId(),
      linking_thread_id: linkingThreadId,
      linked_thread_id: linkedThreadId,
      address: app.user.activeAccount.address,
      author_chain: app.user.activeAccount.chain.id,
      remove_link: true,
      jwt: app.user.jwt,
    });
    if (response.status !== 'Success') {
      throw new Error();
    }
    this._store.add(modelFromServer(response.result));
  }

  public async fetchThreadIdsForSnapshot(args: { snapshot: string }) {
    const response = await $.ajax({
      url: `${app.serverUrl()}/fetchThreadForSnapshot`,
      type: 'GET',
      data: {
        snapshot: args.snapshot,
        chain: app.activeChainId(),
      },
    });
    if (response.status === 'Failure') {
      return null;
    }
    return response.result;
  }

  public async fetchThreadsFromId(
    ids: Array<number | string>
  ): Promise<Thread[]> {
    const params = {
      chain: app.activeChainId(),
      ids,
    };
    const response = await $.get(`${app.serverUrl()}/getThreads`, params);
    if (response.status !== 'Success') {
      throw new Error(`Cannot fetch thread: ${response.status}`);
    }
    return response.result.map((rawThread) => {
      const thread = modelFromServer(rawThread);
      const existing = this._store.getByIdentifier(thread.id);
      if (existing) this._store.remove(existing);
      this._store.update(thread);
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
  }) {
    if (this.listingStore.isDepleted(options)) {
      return;
    }
    const { topicName, stageName } = options;
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

    const response = await $.get(`${app.serverUrl()}/bulkThreads`, params);
    if (response.status !== 'Success') {
      throw new Error(`Unsuccessful refresh status: ${response.status}`);
    }
    const { threads } = response.result;
    const modeledThreads: Thread[] = threads.map((t) => {
      return modelFromServer(t);
    });

    modeledThreads.forEach((thread) => {
      try {
        this._store.add(thread);
        this._listingStore.add(thread);
      } catch (e) {
        console.error(e.message);
      }
    });

    // Update listing cutoff date (date up to which threads have been fetched)
    if (modeledThreads?.length) {
      const lastThread = modeledThreads.sort(orderDiscussionsbyLastComment)[
        modeledThreads.length - 1
      ];
      const cutoffDate = lastThread.lastCommentedOn || lastThread.createdAt;
      this.listingStore.setCutoffDate(options, cutoffDate);
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
    if (threads.length < DEFAULT_PAGE_SIZE) {
      this.listingStore.depleteListing(options);
    }
  }

  public initialize(initialThreads = [], numVotingThreads, reset) {
    if (reset) {
      this._store.clear();
      this._listingStore.clear();
    }
    for (const thread of initialThreads) {
      const modeledThread = modelFromServer(thread);
      if (!thread.Address) {
        console.error('Thread missing address');
      }
      try {
        this._store.add(modeledThread);
        this._listingStore.add(modeledThread);
      } catch (e) {
        console.error(e.message);
      }
    }
    this.numVotingThreads = numVotingThreads;
    this._initialized = true;
  }

  public deinit() {
    this._initialized = false;
    this._store.clear();
    this._listingStore.clear();
  }
}

export default ThreadsController;
