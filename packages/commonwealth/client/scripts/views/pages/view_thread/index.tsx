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
import {
  Comment,
  Poll,
  Thread,
  ThreadStage as ThreadStageType,
  Topic,
} from 'models';
import { ContentType } from 'types';
import { PageLoading } from 'views/pages/loading';
import { PageNotFound } from 'views/pages/404';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { activeQuillEditorHasText } from './helpers';
import { ThreadSidebar } from './thread_sidebar';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ExternalLink, ThreadAuthor, ThreadStage } from './thread_components';
import { CommentsTree } from '../../components/comments/comments_tree';
import { SharePopover } from '../../components/share_popover';
import { clearEditingLocalStorage } from '../../components/comments/helpers';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { getThreadSubScriptionMenuItem } from '../discussions/discussion_row_menu';
import { CollapsibleBodyText } from '../../components/collapsible_body_text';
import { CreateComment } from '../../components/comments/create_comment';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import { EditBody } from './edit_body';

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
  private isEditingBody: boolean;
  private isGloballyEditing: boolean;
  private polls: Poll[];
  private prefetch: ThreadPrefetch;
  private recentlyEdited: boolean;
  private savedEdits: string;
  private shouldRestoreEdits: boolean;
  private thread: Thread;
  private threadFetched: boolean;
  private threadFetchFailed: boolean;
  private title: string;
  private viewCount: number;

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

    if (this.thread) {
      this.title = this.thread.title;
    }

    if (threadRecentlyEdited) {
      this.recentlyEdited = false;
    }

    if (identifier !== `${threadId}-${slugify(this.thread.title)}`) {
      navigateToSubpage(
        getProposalUrlPath(
          this.thread.slug,
          `${threadId}-${slugify(this.thread.title)}`,
          true
        ),
        {},
        { replace: true }
      );
    }

    // load proposal
    if (!this.prefetch[threadIdAndType]['threadReactionsStarted']) {
      app.threads.fetchReactionsCount([this.thread]).then(() => m.redraw);
      this.prefetch[threadIdAndType]['threadReactionsStarted'] = true;
    }

    // load comments
    if (!this.prefetch[threadIdAndType]['commentsStarted']) {
      app.comments
        .refresh(this.thread, app.activeChainId())
        .then(async () => {
          this.comments = app.comments
            .getByProposal(this.thread)
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
                .getByProposal(this.thread)
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
        .getByProposal(this.thread)
        .filter((c) => c.parentComment === null);
      m.redraw();
    };

    // load polls
    if (!this.prefetch[threadIdAndType]['pollsStarted']) {
      app.polls.fetchPolls(app.activeChainId(), this.thread.id).catch(() => {
        notifyError('Failed to load comments');
        this.comments = [];
        m.redraw();
      });

      this.prefetch[threadIdAndType]['pollsStarted'] = true;
    } else {
      this.polls = app.polls.getByThreadId(this.thread.id);
    }

    // load view count
    if (!this.prefetch[threadIdAndType]['viewCountStarted']) {
      $.post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        object_id: this.thread.id,
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
      app.profiles.getProfile(this.thread.authorChain, this.thread.author);

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

    const commentCount = app.comments.nComments(this.thread);

    // Original posters have full editorial control, while added collaborators
    // merely have access to the body and title
    const { activeAccount } = app.user;

    const isAuthor =
      activeAccount?.address === this.thread.author &&
      activeAccount?.chain.id === this.thread.authorChain;

    const isEditor =
      this.thread.collaborators?.filter((c) => {
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

    const showLinkedSnapshotOptions =
      this.thread.snapshotProposal?.length > 0 ||
      this.thread.chainEntities?.length > 0 ||
      isAuthor ||
      isAdminOrMod;

    const showLinkedThreadOptions =
      this.thread.linkedThreads?.length > 0 || isAuthor || isAdminOrMod;

    const windowListener = (e) => {
      if (this.isGloballyEditing || activeQuillEditorHasText()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', windowListener);

    const canComment =
      app.user.activeAccount ||
      (!isAdminOrMod && TopicGateCheck.isGatedTopic(this.thread?.topic?.name));

    const setIsGloballyEditing = (status: boolean) => {
      this.isGloballyEditing = status;

      if (status === false) {
        this.recentlyEdited = true;
      }

      m.redraw();
    };

    const setIsEditingBody = (status: boolean) => {
      setIsGloballyEditing(status);
      this.isEditingBody = status;
    };

    const reactionsAndReplyButtons = (
      <div class="thread-footer-row">
        <ThreadReactionButton thread={this.thread} />
        <div class="comments-count">
          <CWIcon iconName="feedback" iconSize="small" />
          <CWText type="caption">{commentCount} Comments</CWText>
        </div>
      </div>
    );

    const hasEditPerms = isAuthor || isAdminOrMod || isEditor;

    return (
      <Sublayout
      //  title={headerTitle}
      >
        <CWContentPage
          contentBodyLabel="Thread"
          showSidebar={
            showLinkedSnapshotOptions ||
            showLinkedThreadOptions ||
            this.polls?.length > 0 ||
            isAuthor
          }
          title={
            this.isEditingBody ? (
              <CWTextInput
                oninput={(e) => {
                  this.title = e.target.value;
                }}
                value={this.title}
              />
            ) : (
              this.thread.title
            )
          }
          author={<ThreadAuthor thread={this.thread} />}
          createdAt={this.thread.createdAt}
          viewCount={this.viewCount}
          readOnly={this.thread.readOnly}
          subHeader={
            <>
              {this.thread.stage !== ThreadStageType.Discussion && (
                <ThreadStage thread={this.thread} />
              )}
              <SharePopover />
              {!!this.thread.url && <ExternalLink thread={this.thread} />}
            </>
          }
          actions={
            app.isLoggedIn() &&
            hasEditPerms &&
            !this.isGloballyEditing && [
              ...(hasEditPerms && !this.thread.readOnly
                ? [
                    {
                      label: 'Edit',
                      iconLeft: 'write',
                      onclick: async (e) => {
                        e.preventDefault();
                        this.savedEdits = localStorage.getItem(
                          `${app.activeChainId()}-edit-thread-${
                            this.thread.id
                          }-storedText`
                        );

                        if (this.savedEdits) {
                          clearEditingLocalStorage(
                            this.thread.id,
                            ContentType.Thread
                          );
                          this.shouldRestoreEdits =
                            await confirmationModalWithText(
                              'Previous changes found. Restore edits?',
                              'Yes',
                              'No'
                            )();
                        }

                        setIsEditingBody(true);
                      },
                    },
                  ]
                : []),
              ...(isAuthor
                ? [
                    {
                      label: 'Edit collaborators',
                      iconLeft: 'write',
                      onclick: async (e) => {
                        e.preventDefault();
                        app.modals.create({
                          modal: EditCollaboratorsModal,
                          data: {
                            thread: this.thread,
                          },
                        });
                      },
                    },
                  ]
                : []),
              ...(isAdminOrMod
                ? [
                    {
                      label: 'Change topic',
                      iconLeft: 'write',
                      onclick: (e) => {
                        e.preventDefault();
                        app.modals.create({
                          modal: ChangeTopicModal,
                          data: {
                            onChangeHandler: (topic: Topic) => {
                              this.thread.topic = topic;
                              m.redraw();
                            },
                            thread: this.thread,
                          },
                        });
                      },
                    },
                  ]
                : []),
              ...(isAuthor || isAdminOrMod || app.user.isSiteAdmin
                ? [
                    {
                      label: 'Delete',
                      iconLeft: 'trash',
                      onclick: async (e) => {
                        e.preventDefault();

                        const confirmed = await confirmationModalWithText(
                          'Delete this entire thread?'
                        )();

                        if (!confirmed) return;

                        app.threads.delete(this.thread).then(() => {
                          navigateToSubpage('/discussions');
                        });
                      },
                    },
                  ]
                : []),
              ...(isAuthor || isAdminOrMod
                ? [
                    {
                      label: this.thread.readOnly
                        ? 'Unlock thread'
                        : 'Lock thread',
                      iconLeft: 'lock',
                      onclick: (e) => {
                        e.preventDefault();
                        app.threads
                          .setPrivacy({
                            threadId: this.thread.id,
                            readOnly: !this.thread.readOnly,
                          })
                          .then(() => {
                            setIsEditingBody(false);
                            m.redraw();
                          });
                      },
                    },
                  ]
                : []),
              ...((isAuthor || isAdminOrMod) &&
              !!app.chain?.meta.snapshot.length
                ? [
                    {
                      label: 'Snapshot proposal from thread',
                      iconLeft: 'democraticProposal',
                      onclick: () => {
                        const snapshotSpaces = app.chain.meta.snapshot;

                        if (snapshotSpaces.length > 1) {
                          navigateToSubpage('/multiple-snapshots', {
                            action: 'create-from-thread',
                            thread: this.thread,
                          });
                        } else {
                          navigateToSubpage(`/snapshot/${snapshotSpaces}`);
                        }
                      },
                    },
                  ]
                : []),
              ...(isAuthor || isAdminOrMod
                ? [
                    { type: 'divider' },
                    getThreadSubScriptionMenuItem(this.thread),
                  ]
                : []),
            ]
          }
          body={
            <div class="thread-content">
              {this.isEditingBody ? (
                <>
                  {reactionsAndReplyButtons}
                  <EditBody
                    thread={this.thread}
                    savedEdits={this.savedEdits}
                    shouldRestoreEdits={this.shouldRestoreEdits}
                    setIsEditing={setIsEditingBody}
                    title={this.title}
                  />
                </>
              ) : (
                <>
                  <CollapsibleBodyText item={this.thread} />
                  {this.thread.readOnly ? (
                    <CWText type="h5" className="callout-text">
                      Commenting is disabled because this post has been locked.
                    </CWText>
                  ) : !this.isGloballyEditing && canComment ? (
                    <>
                      {reactionsAndReplyButtons}
                      <CreateComment
                        updatedCommentsCallback={updatedCommentsCallback}
                        setIsGloballyEditing={setIsGloballyEditing}
                        isGloballyEditing={this.isGloballyEditing}
                        parentComment={null}
                        rootProposal={this.thread}
                      />
                    </>
                  ) : null}
                </>
              )}
            </div>
          }
          comments={
            <CommentsTree
              comments={this.comments}
              proposal={this.thread}
              setIsGloballyEditing={setIsGloballyEditing}
              updatedCommentsCallback={updatedCommentsCallback}
            />
          }
          sidebarComponents={[
            {
              label: 'Info',
              item: (
                <ThreadSidebar
                  isAdmin={isAdmin}
                  isAdminOrMod={isAdminOrMod}
                  isAuthor={isAuthor}
                  polls={this.polls}
                  thread={this.thread}
                  showLinkedSnapshotOptions={showLinkedSnapshotOptions}
                  showLinkedThreadOptions={showLinkedThreadOptions}
                />
              ),
            },
          ]}
        />
      </Sublayout>
    );
  }
}

export default ViewThreadPage;
