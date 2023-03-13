/* @jsx m */

import { navigateToSubpage } from 'router';
import ClassComponent from 'class_component';
import { ProposalType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { getProposalUrlPath, idToProposal } from 'identifiers';
import $ from 'jquery';
import m from 'mithril';
import type { ChainEntity, Comment, Poll, Thread, Topic } from 'models';
import { ThreadStage as ThreadStageType } from 'models';

import 'pages/view_thread/index.scss';

import app from 'state';
import { ContentType } from 'types';
import { slugify } from 'utils';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CollapsibleThreadBody } from '../../components/collapsible_body_text';
import { CommentsTree } from '../../components/comments/comments_tree';
import { CreateComment } from '../../components/comments/create_comment';
import { clearEditingLocalStorage } from '../../components/comments/helpers';
import type { SidebarComponents } from '../../components/component_kit/cw_content_page';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ThreadReactionButton } from '../../components/reaction_button/thread_reaction_button';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import { getThreadSubScriptionMenuItem } from '../discussions/helpers';
import { EditBody } from './edit_body';
import { activeQuillEditorHasText } from './helpers';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { ThreadPollCard, ThreadPollEditorCard } from './poll_cards';
import { ExternalLink, ThreadAuthor, ThreadStage } from './thread_components';

export type ThreadPrefetch = {
  [identifier: string]: {
    commentsStarted: boolean;
    pollsStarted?: boolean;
    profilesFinished: boolean;
    profilesStarted: boolean;
    viewCountStarted?: boolean;
  };
};

type ViewThreadPageAttrs = {
  identifier: string;
};

class ViewThreadPage extends ClassComponent<ViewThreadPageAttrs> {
  private comments: Array<Comment<Thread>>;
  private isEditingBody: boolean;
  private isGloballyEditing: boolean;
  private polls: Array<Poll>;
  private prefetch: ThreadPrefetch;
  private recentlyEdited: boolean;
  private savedEdits: string;
  private shouldRestoreEdits: boolean;
  private thread: Thread;
  private threadFetched: boolean;
  private threadFetchFailed: boolean;
  private title: string;
  private viewCount: number;

  editorListener(e) {
    if (this.isGloballyEditing || activeQuillEditorHasText()) {
      e.preventDefault();
      e.returnValue = '';
    }
  }

  oninit() {
    window.addEventListener('beforeunload', (e) => {
      this.editorListener(e);
    });
  }

  onremove() {
    window.removeEventListener('beforeunload', (e) => {
      this.editorListener(e);
    });
  }

  view(vnode: m.Vnode<ViewThreadPageAttrs>) {
    const { identifier } = vnode.attrs;

    if (!app.chain?.meta) {
      return (
        <PageLoading
        // title="Loading..."
        />
      );
    }

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

    if (threadRecentlyEdited) {
      this.recentlyEdited = false;
    }

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
              active_address: app.user.activeAddressAccount?.address,
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
      app.newProfiles.getProfile(thread.authorChain, thread.author);

      this.comments.forEach((comment) => {
        app.newProfiles.getProfile(comment.authorChain, comment.author);
      });

      this.prefetch[threadIdAndType]['profilesStarted'] = true;
    }

    if (
      !app.newProfiles.allLoaded() &&
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
    const { activeAddressAccount } = app.user;

    const isAuthor =
      activeAddressAccount?.address === thread.author &&
      activeAddressAccount?.chain.id === thread.authorChain;

    const isEditor =
      thread.collaborators?.filter((c) => {
        return (
          c.address === activeAddressAccount?.address &&
          c.chain === activeAddressAccount?.chain.id
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

    const showLinkedProposalOptions =
      thread.snapshotProposal?.length > 0 ||
      thread.chainEntities?.length > 0 ||
      isAuthor ||
      isAdminOrMod;

    const showLinkedThreadOptions =
      thread.linkedThreads?.length > 0 || isAuthor || isAdminOrMod;

    const canComment =
      app.user.activeAddressAccount ||
      (!isAdminOrMod && TopicGateCheck.isGatedTopic(thread?.topic?.name));

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
        <ThreadReactionButton thread={thread} />
        <div class="comments-count">
          <CWIcon iconName="feedback" iconSize="small" />
          <CWText type="caption">{commentCount} Comments</CWText>
        </div>
      </div>
    );

    const hasEditPerms = isAuthor || isEditor;

    const getActionMenuItems = () => {
      return [
        ...(hasEditPerms && !thread.readOnly
          ? [
              {
                label: 'Edit',
                iconLeft: 'write' as const,
                onclick: async (e) => {
                  e.preventDefault();
                  this.savedEdits = localStorage.getItem(
                    `${app.activeChainId()}-edit-thread-${thread.id}-storedText`
                  );

                  if (this.savedEdits) {
                    clearEditingLocalStorage(thread.id, ContentType.Thread);
                    this.shouldRestoreEdits = await confirmationModalWithText(
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
        ...(hasEditPerms
          ? [
              {
                label: 'Edit collaborators',
                iconLeft: 'write' as const,
                onclick: async (e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: EditCollaboratorsModal,
                    data: {
                      thread,
                    },
                  });
                },
              },
            ]
          : []),
        ...(isAdminOrMod || isAuthor
          ? [
              {
                label: 'Change topic',
                iconLeft: 'write' as const,
                onclick: (e) => {
                  e.preventDefault();
                  app.modals.create({
                    modal: ChangeTopicModal,
                    data: {
                      onChangeHandler: (topic: Topic) => {
                        thread.topic = topic;
                        m.redraw();
                      },
                      thread,
                    },
                  });
                },
              },
            ]
          : []),
        ...(isAuthor || isAdminOrMod
          ? [
              {
                label: 'Delete',
                iconLeft: 'trash' as const,
                onclick: async (e) => {
                  e.preventDefault();

                  const confirmed = await confirmationModalWithText(
                    'Delete this entire thread?'
                  )();

                  if (!confirmed) return;

                  app.threads.delete(thread).then(() => {
                    navigateToSubpage('/discussions');
                  });
                },
              },
            ]
          : []),
        ...(isAuthor || isAdminOrMod
          ? [
              {
                label: thread.readOnly ? 'Unlock thread' : 'Lock thread',
                iconLeft: 'lock' as const,
                onclick: (e) => {
                  e.preventDefault();
                  app.threads
                    .setPrivacy({
                      threadId: thread.id,
                      readOnly: !thread.readOnly,
                    })
                    .then(() => {
                      setIsEditingBody(false);
                      m.redraw();
                    });
                },
              },
            ]
          : []),
        ...((isAuthor || isAdminOrMod) && !!app.chain?.meta.snapshot.length
          ? [
              {
                label: 'Snapshot proposal from thread',
                iconLeft: 'democraticProposal' as const,
                onclick: () => {
                  const snapshotSpaces = app.chain.meta.snapshot;

                  if (snapshotSpaces.length > 1) {
                    navigateToSubpage('/multiple-snapshots', {
                      action: 'create-from-thread',
                      thread,
                    });
                  } else {
                    navigateToSubpage(`/snapshot/${snapshotSpaces}`);
                  }
                },
              },
            ]
          : []),
        { type: 'divider' as const },
        getThreadSubScriptionMenuItem(thread),
      ];
    };

    const isAuthorOrAdmin =
      app.roles.isAdminOfEntity({ chain: app.activeChainId() }) ||
      app.user.activeAddressAccount?.address ===
        app.chain.accounts.get(thread.author).address;

    return (
      <Sublayout
      //  title={headerTitle}
      >
        <CWContentPage
          contentBodyLabel="Thread"
          showSidebar={
            showLinkedProposalOptions ||
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
                defaultValue={thread.title}
              />
            ) : (
              thread.title
            )
          }
          author={<ThreadAuthor thread={thread} />}
          createdAt={thread.createdAt}
          viewCount={this.viewCount}
          readOnly={thread.readOnly}
          headerComponents={
            thread.stage !== ThreadStageType.Discussion && (
              <ThreadStage thread={thread} />
            )
          }
          subHeader={!!thread.url && <ExternalLink thread={thread} />}
          actions={
            app.user.activeAddressAccount &&
            !this.isGloballyEditing &&
            getActionMenuItems()
          }
          body={
            <div class="thread-content">
              {this.isEditingBody ? (
                <>
                  {reactionsAndReplyButtons}
                  <EditBody
                    thread={thread}
                    savedEdits={this.savedEdits}
                    shouldRestoreEdits={this.shouldRestoreEdits}
                    setIsEditing={setIsEditingBody}
                    title={this.title}
                  />
                </>
              ) : (
                <>
                  <CollapsibleThreadBody thread={thread} />
                  {thread.readOnly ? (
                    <CWText type="h5" className="callout-text">
                      Commenting is disabled because this post has been locked.
                    </CWText>
                  ) : !this.isGloballyEditing &&
                    canComment &&
                    app.isLoggedIn() ? (
                    <>
                      {reactionsAndReplyButtons}
                      <CreateComment
                        updatedCommentsCallback={updatedCommentsCallback}
                        setIsGloballyEditing={setIsGloballyEditing}
                        isGloballyEditing={this.isGloballyEditing}
                        parentComment={null}
                        rootProposal={thread}
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
              proposal={thread}
              setIsGloballyEditing={setIsGloballyEditing}
              updatedCommentsCallback={updatedCommentsCallback}
            />
          }
          sidebarComponents={
            [
              ...(showLinkedProposalOptions || showLinkedThreadOptions
                ? [
                    {
                      label: 'Links',
                      item: (
                        <div class="cards-column">
                          {showLinkedProposalOptions && (
                            <LinkedProposalsCard
                              onChangeHandler={(
                                stage: ThreadStageType,
                                chainEntities: ChainEntity[],
                                snapshotProposal: SnapshotProposal[]
                              ) => {
                                thread.stage = stage;
                                thread.chainEntities = chainEntities;
                                if (app.chain?.meta.snapshot.length) {
                                  thread.snapshotProposal =
                                    snapshotProposal[0]?.id;
                                }
                                app.threads.fetchThreadsFromId([
                                  thread.identifier,
                                ]);
                                m.redraw();
                              }}
                              thread={thread}
                              showAddProposalButton={isAuthor || isAdminOrMod}
                            />
                          )}
                          {showLinkedThreadOptions && (
                            <LinkedThreadsCard
                              threadId={thread.id}
                              allowLinking={isAuthor || isAdminOrMod}
                            />
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
              ...(this.polls?.length > 0 ||
              (isAuthor && (!app.chain?.meta?.adminOnlyPolling || isAdmin))
                ? [
                    {
                      label: 'Polls',
                      item: (
                        <div class="cards-column">
                          {[
                            ...new Map(
                              this.polls?.map((poll) => [poll.id, poll])
                            ).values(),
                          ].map((poll: Poll) => {
                            return (
                              <ThreadPollCard
                                poll={poll}
                                showDeleteButton={isAuthorOrAdmin}
                              />
                            );
                          })}
                          {isAuthor &&
                            (!app.chain?.meta?.adminOnlyPolling || isAdmin) && (
                              <ThreadPollEditorCard
                                thread={thread}
                                threadAlreadyHasPolling={!this.polls?.length}
                              />
                            )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ] as SidebarComponents
          }
        />
      </Sublayout>
    );
  }
}

export default ViewThreadPage;
