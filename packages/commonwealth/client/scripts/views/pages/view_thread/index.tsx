import React, { useState } from 'react';

import { ProposalType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { getProposalUrlPath, idToProposal } from 'identifiers';
import $ from 'jquery';

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
import { useCommonNavigate } from 'navigation/helpers';

export type ThreadPrefetch = {
  [identifier: string]: {
    commentsStarted: boolean;
    pollsStarted?: boolean;
    profilesFinished: boolean;
    profilesStarted: boolean;
    viewCountStarted?: boolean;
    threadReactionsStarted?: boolean;
  };
};

type ViewThreadPageAttrs = {
  identifier: string;
};

const ViewThreadPage: React.FC<ViewThreadPageAttrs> = ({ identifier }) => {
  const navigate = useCommonNavigate();
  const [comments, setComments] = useState<Array<Comment<Thread>>>();
  const [isEditingBody, setIsEditingBody] = useState<boolean>();
  const [isGloballyEditing, setIsGloballyEditing] = useState<boolean>();
  const [polls, setPolls] = useState<Array<Poll>>();
  const [prefetch, setPrefetch] = useState<ThreadPrefetch>({});
  const [recentlyEdited, setRecentlyEdited] = useState<boolean>();
  const [savedEdits, setSavedEdits] = useState<string>();
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState<boolean>();
  const [thread, setThread] = useState<Thread>();
  const [threadFetched, setThreadFetched] = useState<boolean>();
  const [threadFetchFailed, setThreadFetchFailed] = useState<boolean>();
  const [title, setTitle] = useState<string>();
  const [viewCount, setViewCount] = useState<number>();
  const [initializedComments, setInitializedComments] =
    useState<boolean>(false);
  const [initializedPolls, setInitializedPolls] = useState<boolean>(false);

  // editorListener(e) {
  //   if (this.isGloballyEditing || activeQuillEditorHasText()) {
  //     e.preventDefault();
  //     e.returnValue = '';
  //   }
  // }

  // oninit() {
  //   window.addEventListener('beforeunload', (e) => {
  //     this.editorListener(e);
  //   });
  // }

  // onremove() {
  //   window.removeEventListener('beforeunload', (e) => {
  //     this.editorListener(e);
  //   });
  // }

  if (!app.chain?.meta) {
    return (
      <PageLoading
      // title="Loading..."
      />
    );
  }

  if (typeof identifier !== 'string') {
    return (
      <PageNotFound
      // title={headerTitle}
      />
    );
  }

  const threadId = identifier.split('-')[0];
  const threadIdAndType = `${threadId}-${ProposalType.Thread}`;

  // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
  if (!prefetch[threadIdAndType]) {
    setPrefetch({
      ...prefetch,
      [threadIdAndType]: {
        commentsStarted: false,
        pollsStarted: false,
        viewCountStarted: false,
        profilesStarted: false,
        profilesFinished: false,
      },
    });
  }

  if (threadFetchFailed) {
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

  const threadDoesNotMatch =
    thread &&
    (+thread.identifier !== +threadId || thread.slug !== ProposalType.Thread);

  if (threadDoesNotMatch) {
    setThread(undefined);
    setRecentlyEdited(false);
    setThreadFetched(false);
  }

  // load thread, and return PageLoading
  if (!thread || recentlyEdited) {
    try {
      const _thread = idToProposal(ProposalType.Thread, threadId);
      if (_thread === undefined) throw new Error();
      setThread(_thread);
    } catch (e) {
      // proposal might be loading, if it's not an thread
      if (!threadFetched) {
        app.threads
          .fetchThreadsFromId([+threadId])
          .then((res) => {
            setThread(res[0]);
          })
          .catch(() => {
            notifyError('Thread not found');
            setThreadFetchFailed(true);
          });

        setThreadFetched(true);
      }
    }
    return (
      <PageLoading
      //  title={headerTitle}
      />
    );
  }

  if (recentlyEdited) {
    setRecentlyEdited(false);
    return (
      <PageLoading
      //  title={headerTitle}
      />
    );
  }

  if (identifier !== `${threadId}-${slugify(thread.title)}`) {
    navigate(
      getProposalUrlPath(
        thread.slug,
        `${threadId}-${slugify(thread.title)}`,
        true
      ),
      { replace: true }
    );
  }

  // load proposal
  if (!prefetch[threadIdAndType]['threadReactionsStarted']) {
    app.threads.fetchReactionsCount([thread]).then(() => setThread(thread));
    setPrefetch({
      ...prefetch,
      [threadIdAndType]: {
        ...prefetch[threadIdAndType],
        threadReactionsStarted: true,
      },
    });
    return (
      <PageLoading
      //  title={headerTitle}
      />
    );
  }

  // load comments
  if (!prefetch[threadIdAndType]['commentsStarted']) {
    app.comments
      .refresh(thread, app.activeChainId())
      .then(async () => {
        // fetch comments
        const _comments = app.comments
          .getByProposal(thread)
          .filter((c) => c.parentComment === null);
        setComments(_comments);

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
      })
      .catch(() => {
        notifyError('Failed to load comments');
        setComments([]);
      });

    setPrefetch({
      ...prefetch,
      [threadIdAndType]: {
        ...prefetch[threadIdAndType],
        commentsStarted: true,
      },
    });
    return (
      <PageLoading
      //  title={headerTitle}
      />
    );
  }

  if (comments && comments.length > 0) {
    const mismatchedComments = comments.filter((c) => {
      return c.rootProposal !== `${ProposalType.Thread}_${threadId}`;
    });

    if (mismatchedComments.length) {
      setPrefetch({
        ...prefetch,
        [threadIdAndType]: {
          ...prefetch[threadIdAndType],
          commentsStarted: false,
        },
      });
      return (
        <PageLoading
        //  title={headerTitle}
        />
      );
    }
  }

  const updatedCommentsCallback = () => {
    const _comments =
      app.comments
        .getByProposal(thread)
        .filter((c) => c.parentComment === null) || [];
    setComments(_comments);
  };
  if (!initializedComments) {
    setInitializedComments(true);
    updatedCommentsCallback();
  }

  // load polls
  if (!prefetch[threadIdAndType]['pollsStarted']) {
    app.polls.fetchPolls(app.activeChainId(), thread.id).catch(() => {
      notifyError('Failed to load comments');
      setComments([]);
      setPolls(app.polls.getByThreadId(thread.id));
    });

    setPrefetch({
      ...prefetch,
      [threadIdAndType]: {
        ...prefetch[threadIdAndType],
        pollsStarted: true,
      },
    });
  }
  if (!initializedPolls) {
    setInitializedPolls(true);
    setPolls(app.polls.getByThreadId(thread.id));
  }

  // load view count
  if (!prefetch[threadIdAndType]['viewCountStarted']) {
    $.post(`${app.serverUrl()}/viewCount`, {
      chain: app.activeChainId(),
      object_id: thread.id,
    })
      .then((response) => {
        if (response.status !== 'Success') {
          setViewCount(0);
          throw new Error(`got unsuccessful status: ${response.status}`);
        } else {
          setViewCount(response.result.view_count);
        }
      })
      .catch(() => {
        setViewCount(0);
        throw new Error('could not load view count');
      });

    setPrefetch({
      ...prefetch,
      [threadIdAndType]: {
        ...prefetch[threadIdAndType],
        viewCountStarted: true,
      },
    });
  }

  if (comments === undefined || viewCount === undefined) {
    return (
      <PageLoading
      //  title={headerTitle}
      />
    );
  }

  // load profiles
  if (!prefetch[threadIdAndType]['profilesStarted']) {
    app.profiles.getProfile(thread.authorChain, thread.author);

    comments.forEach((comment) => {
      app.profiles.getProfile(comment.authorChain, comment.author);
    });

    app.profiles.isFetched.on('redraw', () => {
      if (!prefetch[threadIdAndType]['profilesFinished']) {
        setPrefetch({
          ...prefetch,
          [threadIdAndType]: {
            ...prefetch[threadIdAndType],
            profilesFinished: true,
          },
        });
      }
    });

    setPrefetch({
      ...prefetch,
      [threadIdAndType]: {
        ...prefetch[threadIdAndType],
        profilesStarted: true,
      },
    });
    return (
      <PageLoading
      //  title={headerTitle}
      />
    );
  }

  if (
    !app.profiles.allLoaded() &&
    !prefetch[threadIdAndType]['profilesFinished']
  ) {
    return (
      <PageLoading
      //  title={headerTitle}
      />
    );
  }

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

  const showLinkedProposalOptions =
    thread.snapshotProposal?.length > 0 ||
    thread.chainEntities?.length > 0 ||
    isAuthor ||
    isAdminOrMod;

  const showLinkedThreadOptions =
    thread.linkedThreads?.length > 0 || isAuthor || isAdminOrMod;

  const canComment =
    app.user.activeAccount ||
    (!isAdminOrMod && TopicGateCheck.isGatedTopic(thread?.topic?.name));

  const reactionsAndReplyButtons = (
    <div className="thread-footer-row">
      <ThreadReactionButton thread={thread} />
      <div className="comments-count">
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
              onClick: async (e) => {
                e.preventDefault();
                setSavedEdits(
                  localStorage.getItem(
                    `${app.activeChainId()}-edit-thread-${thread.id}-storedText`
                  )
                );

                if (savedEdits) {
                  clearEditingLocalStorage(thread.id, ContentType.Thread);
                  setShouldRestoreEdits(
                    await confirmationModalWithText(
                      'Previous changes found. Restore edits?',
                      'Yes',
                      'No'
                    )()
                  );
                }

                setIsGloballyEditing(true);
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
              onClick: async (e) => {
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
              onClick: (e) => {
                e.preventDefault();
                app.modals.create({
                  modal: ChangeTopicModal,
                  data: {
                    onChangeHandler: (topic: Topic) => {
                      thread.topic = topic;
                      setThread(thread);
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
              onClick: async (e) => {
                e.preventDefault();

                const confirmed = await confirmationModalWithText(
                  'Delete this entire thread?'
                )();

                if (!confirmed) return;

                app.threads.delete(thread).then(() => {
                  navigate('/discussions');
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
              onClick: (e) => {
                e.preventDefault();
                app.threads
                  .setPrivacy({
                    threadId: thread.id,
                    readOnly: !thread.readOnly,
                  })
                  .then(() => {
                    setIsGloballyEditing(false);
                    setIsEditingBody(false);
                    setRecentlyEdited(true);
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
              onClick: () => {
                const snapshotSpaces = app.chain.meta.snapshot;

                if (snapshotSpaces.length > 1) {
                  navigate('/multiple-snapshots');
                } else {
                  navigate(`/snapshot/${snapshotSpaces}`);
                }
              },
            },
          ]
        : []),
      { type: 'divider' as const },
      getThreadSubScriptionMenuItem(thread),
    ];
  };

  return (
    <Sublayout
    //  title={headerTitle}
    >
      <CWContentPage
        contentBodyLabel="Thread"
        showSidebar={
          showLinkedProposalOptions ||
          showLinkedThreadOptions ||
          polls?.length > 0 ||
          isAuthor
        }
        title={
          isEditingBody ? (
            <CWTextInput
              onInput={(e) => {
                setTitle(e.target.value);
              }}
              defaultValue={thread.title}
            />
          ) : (
            thread.title
          )
        }
        author={<ThreadAuthor thread={thread} />}
        createdAt={thread.createdAt}
        viewCount={viewCount}
        readOnly={thread.readOnly}
        headerComponents={
          thread.stage !== ThreadStageType.Discussion && (
            <ThreadStage thread={thread} />
          )
        }
        subHeader={!!thread.url && <ExternalLink thread={thread} />}
        actions={
          app.user.activeAccount && !isGloballyEditing && getActionMenuItems()
        }
        body={
          <div className="thread-content">
            {isEditingBody ? (
              <>
                {reactionsAndReplyButtons}
                <EditBody
                  thread={thread}
                  savedEdits={savedEdits}
                  shouldRestoreEdits={shouldRestoreEdits}
                  setIsEditing={setIsEditingBody}
                  title={title}
                />
              </>
            ) : (
              <>
                {/* <CollapsibleThreadBody thread={thread} /> */}
                {thread.readOnly ? (
                  <CWText type="h5" className="callout-text">
                    Commenting is disabled because this post has been locked.
                  </CWText>
                ) : !isGloballyEditing && canComment && app.isLoggedIn() ? (
                  <>
                    {reactionsAndReplyButtons}
                    <CreateComment
                      updatedCommentsCallback={updatedCommentsCallback}
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
            comments={comments}
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
                      <div className="cards-column">
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
                              setThread(thread);
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
            ...(polls?.length > 0 ||
            (isAuthor && (!app.chain?.meta?.adminOnlyPolling || isAdmin))
              ? [
                  {
                    label: 'Polls',
                    item: (
                      <div className="cards-column">
                        {[
                          ...new Map(
                            polls?.map((poll) => [poll.id, poll])
                          ).values(),
                        ].map((poll: Poll) => {
                          return <ThreadPollCard poll={poll} />;
                        })}
                        {isAuthor &&
                          (!app.chain?.meta?.adminOnlyPolling || isAdmin) && (
                            <ThreadPollEditorCard
                              thread={thread}
                              threadAlreadyHasPolling={!polls?.length}
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
};

export default ViewThreadPage;
