/* @jsx m */

import $ from 'jquery';
import m from 'mithril';

import 'pages/view_proposal/index.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import Sublayout from 'views/sublayout';
import { ProposalType } from 'common-common/src/types';
import { getProposalUrlPath, idToProposal } from 'identifiers';
import { slugify } from 'utils';
import { notifyError } from 'controllers/app/notifications';
import { Comment, Poll, Thread } from 'models';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { CWTabBar, CWTab } from '../../components/component_kit/cw_tabs';
import {
  getClasses,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { activeQuillEditorHasText } from '../view_proposal/helpers';
import { ThreadSidebar } from './thread_sidebar';
import { ThreadBody } from './thread_body';

export type ThreadPrefetch = {
  [identifier: string]: {
    commentsStarted: boolean;
    pollsStarted?: boolean;
    profilesFinished: boolean;
    profilesStarted: boolean;
    viewCountStarted?: boolean;
  };
};

class ViewThreadPage
  implements
    m.ClassComponent<{
      identifier: string;
    }>
{
  private comments: Array<Comment<Thread>>;
  private isGloballyEditing: boolean;
  private polls: Poll[];
  private prefetch: ThreadPrefetch;
  private thread: Thread;
  private recentlyEdited: boolean;
  private tabSelected: 'viewProposal' | 'viewSidebar';
  private threadFetched: boolean;
  private threadFetchFailed: boolean;
  private viewCount: number;

  oninit() {
    this.tabSelected = 'viewProposal';
  }

  view(vnode) {
    const { identifier } = vnode.attrs;

    if (typeof identifier !== 'string')
      return (
        <PageNotFound
        // title={headerTitle}
        />
      );

    const threadId = identifier.split('-')[0];
    const threadIdAndType = `${threadId}-${ProposalType.Thread}`;

    // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
    if (!this.prefetch || !this.prefetch[threadIdAndType]) {
      this.prefetch = {};
      this.prefetch[threadIdAndType] = {
        commentsStarted: false,
        pollsStarted: false,
        viewCountStarted: false,
        profilesStarted: false,
        profilesFinished: false,
      };
    }

    if (this.threadFetchFailed) {
      return (
        <PageNotFound
        // title={headerTitle}
        />
      );
    }

    // load app controller
    if (!app.threads.initialized) {
      return (
        <PageLoading
        // title={headerTitle}
        />
      );
    }

    const threadRecentlyEdited = this.recentlyEdited;

    const threadDoesNotMatch =
      this.thread &&
      (+this.thread.identifier !== +threadId ||
        this.thread.slug !== ProposalType.Thread);

    if (threadDoesNotMatch) {
      this.thread = undefined;
      this.recentlyEdited = false;
      this.threadFetched = false;
    }

    // load thread, and return PageLoading
    if (!this.thread || threadRecentlyEdited) {
      try {
        this.thread = idToProposal(ProposalType.Thread, threadId);
      } catch (e) {
        // proposal might be loading, if it's not an thread
        if (!this.threadFetched) {
          app.threads
            .fetchThreadsFromId([+threadId])
            .then((res) => {
              this.thread = res[0];
              m.redraw();
            })
            .catch(() => {
              notifyError('Thread not found');
              this.threadFetchFailed = true;
            });

          this.threadFetched = true;
        }

        return (
          <PageLoading
          //  title={headerTitle}
          />
        );
      }
    }

    const { thread } = this;

    if (threadRecentlyEdited) this.recentlyEdited = false;

    if (identifier !== `${threadId}-${slugify(thread.title)}`) {
      navigateToSubpage(
        getProposalUrlPath(
          thread.slug,
          `${threadId}-${slugify(thread.title)}`,
          true
        ),
        {},
        { replace: true }
      );
    }

    // load proposal
    if (!this.prefetch[threadIdAndType]['threadReactionsStarted']) {
      app.threads.fetchReactionsCount([thread]).then(() => m.redraw);
      this.prefetch[threadIdAndType]['threadReactionsStarted'] = true;
    }

    // load comments
    if (!this.prefetch[threadIdAndType]['commentsStarted']) {
      app.comments
        .refresh(thread, app.activeChainId())
        .then(async () => {
          this.comments = app.comments
            .getByProposal(thread)
            .filter((c) => c.parentComment === null);

          // fetch reactions
          const { result: reactionCounts } = await $.ajax({
            type: 'POST',
            url: `${app.serverUrl()}/reactionsCounts`,
            headers: {
              'content-type': 'application/json',
            },
            data: JSON.stringify({
              proposal_ids: [threadId],
              comment_ids: app.comments
                .getByProposal(thread)
                .map((comment) => comment.id),
              active_address: app.user.activeAccount?.address,
            }),
          });

          // app.reactionCounts.deinit()
          for (const rc of reactionCounts) {
            const id = app.reactionCounts.store.getIdentifier({
              threadId: rc.thread_id,
              proposalId: rc.proposal_id,
              commentId: rc.comment_id,
            });

            app.reactionCounts.store.add(
              modelReactionCountFromServer({ ...rc, id })
            );
          }
          m.redraw();
        })
        .catch(() => {
          notifyError('Failed to load comments');
          this.comments = [];
          m.redraw();
        });

      this.prefetch[threadIdAndType]['commentsStarted'] = true;
    }

    if (this.comments?.length) {
      const mismatchedComments = this.comments.filter((c) => {
        return c.rootProposal !== `${ProposalType.Thread}_${threadId}`;
      });

      if (mismatchedComments.length) {
        this.prefetch[threadIdAndType]['commentsStarted'] = false;
      }
    }

    const updatedCommentsCallback = () => {
      this.comments = app.comments
        .getByProposal(thread)
        .filter((c) => c.parentComment === null);
      m.redraw();
    };

    // load polls
    if (!this.prefetch[threadIdAndType]['pollsStarted']) {
      app.polls.fetchPolls(app.activeChainId(), thread.id).catch(() => {
        notifyError('Failed to load comments');
        this.comments = [];
        m.redraw();
      });

      this.prefetch[threadIdAndType]['pollsStarted'] = true;
    } else {
      this.polls = app.polls.getByThreadId(thread.id);
    }

    // load view count
    if (!this.prefetch[threadIdAndType]['viewCountStarted']) {
      $.post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        object_id: thread.id,
      })
        .then((response) => {
          if (response.status !== 'Success') {
            this.viewCount = 0;
            throw new Error(`got unsuccessful status: ${response.status}`);
          } else {
            this.viewCount = response.result.view_count;
            m.redraw();
          }
        })
        .catch(() => {
          this.viewCount = 0;
          throw new Error('could not load view count');
        });

      this.prefetch[threadIdAndType]['viewCountStarted'] = true;
    }

    if (this.comments === undefined || this.viewCount === undefined) {
      return (
        <PageLoading
        //  title={headerTitle}
        />
      );
    }

    // load profiles
    if (this.prefetch[threadIdAndType]['profilesStarted'] === undefined) {
      app.profiles.getProfile(thread.authorChain, thread.author);

      this.comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });

      this.prefetch[threadIdAndType]['profilesStarted'] = true;
    }

    if (
      !app.profiles.allLoaded() &&
      !this.prefetch[threadIdAndType]['profilesFinished']
    ) {
      return (
        <PageLoading
        //  title={headerTitle}
        />
      );
    }

    this.prefetch[threadIdAndType]['profilesFinished'] = true;

    const commentCount = app.comments.nComments(thread);

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title
    const { activeAccount } = app.user;

    const isAuthor =
      activeAccount?.address === thread.author &&
      activeAccount?.chain.id === thread.authorChain;

    const isEditor =
      thread.collaborators?.filter((c) => {
        return (
          c.address === activeAccount?.address &&
          c.chain === activeAccount?.chain.id
        );
      }).length > 0;

    const isAdmin =
      app.roles.isRoleOfCommunity({
        role: 'admin',
        chain: app.activeChainId(),
      }) || app.user.isSiteAdmin;

    const isAdminOrMod =
      isAdmin ||
      app.roles.isRoleOfCommunity({
        role: 'moderator',
        chain: app.activeChainId(),
      });

    const setIsGloballyEditing = (status: boolean) => {
      this.isGloballyEditing = status;

      if (status === false) {
        this.recentlyEdited = true;
      }

      m.redraw();
    };

    const showLinkedSnapshotOptions =
      thread.snapshotProposal?.length > 0 ||
      thread.chainEntities?.length > 0 ||
      isAuthor ||
      isAdminOrMod;

    const showLinkedThreadOptions =
      thread.linkedThreads?.length > 0 || isAuthor || isAdminOrMod;

    window.onresize = () => {
      if (
        isWindowMediumSmallInclusive(window.innerWidth) &&
        this.tabSelected !== 'viewProposal'
      ) {
        this.tabSelected = 'viewProposal';
        m.redraw();
      }
    };

    const windowListener = (e) => {
      if (this.isGloballyEditing || activeQuillEditorHasText()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', windowListener);

    const hasSidebar =
      showLinkedSnapshotOptions ||
      showLinkedThreadOptions ||
      this.polls?.length > 0 ||
      isAuthor;

    return (
      <Sublayout
      //  title={headerTitle}
      >
        <div class="ViewProposalPage">
          <div
            class={getClasses<{ hasSidebar?: boolean }>(
              { hasSidebar },
              'proposal-body-with-tabs'
            )}
          >
            <CWTabBar>
              <CWTab
                label="Proposal"
                onclick={() => {
                  this.tabSelected = 'viewProposal';
                }}
                isSelected={this.tabSelected === 'viewProposal'}
              />
              <CWTab
                label="Info & Results"
                onclick={() => {
                  this.tabSelected = 'viewSidebar';
                }}
                isSelected={this.tabSelected === 'viewSidebar'}
              />
            </CWTabBar>
            {this.tabSelected === 'viewProposal' && (
              <ThreadBody
                commentCount={commentCount}
                comments={this.comments}
                updatedCommentsCallback={updatedCommentsCallback}
                setIsGloballyEditing={setIsGloballyEditing}
                isAdminOrMod={isAdminOrMod}
                isAuthor={isAuthor}
                isEditor={isEditor}
                isGloballyEditing={this.isGloballyEditing}
                proposal={thread}
                viewCount={this.viewCount}
              />
            )}
            {hasSidebar && this.tabSelected === 'viewSidebar' && (
              <ThreadSidebar
                isAdmin={isAdmin}
                isAdminOrMod={isAdminOrMod}
                isAuthor={isAuthor}
                polls={this.polls}
                thread={thread}
                showLinkedSnapshotOptions={showLinkedSnapshotOptions}
                showLinkedThreadOptions={showLinkedThreadOptions}
              />
            )}
          </div>
          <div
            class={getClasses<{ hasSidebar?: boolean }>(
              { hasSidebar },
              'proposal-body'
            )}
          >
            <ThreadBody
              commentCount={commentCount}
              comments={this.comments}
              updatedCommentsCallback={updatedCommentsCallback}
              setIsGloballyEditing={setIsGloballyEditing}
              isAdminOrMod={isAdminOrMod}
              isAuthor={isAuthor}
              isEditor={isEditor}
              isGloballyEditing={this.isGloballyEditing}
              proposal={thread}
              viewCount={this.viewCount}
            />
            {hasSidebar && (
              <ThreadSidebar
                isAdmin={isAdmin}
                isAdminOrMod={isAdminOrMod}
                isAuthor={isAuthor}
                polls={this.polls}
                thread={thread}
                showLinkedSnapshotOptions={showLinkedSnapshotOptions}
                showLinkedThreadOptions={showLinkedThreadOptions}
              />
            )}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default ViewThreadPage;
