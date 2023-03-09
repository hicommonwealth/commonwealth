import React, { useCallback, useEffect, useState } from 'react';

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
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import { getThreadSubScriptionMenuItem } from '../discussions/helpers';
import { EditBody } from './edit_body';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { ThreadPollCard, ThreadPollEditorCard } from './poll_cards';
import { ExternalLink, ThreadAuthor, ThreadStage } from './thread_components';
import { useCommonNavigate } from 'navigation/helpers';
import { Modal } from '../../components/component_kit/cw_modal';
import { IThreadCollaborator } from 'client/scripts/models/Thread';

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

type ViewThreadPageProps = {
  identifier: string;
};

const ViewThreadPage = ({ identifier }: ViewThreadPageProps) => {
  const navigate = useCommonNavigate();

  const [comments, setComments] = useState<Array<Comment<Thread>>>([]);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isGloballyEditing, setIsGloballyEditing] = useState(false);
  const [polls, setPolls] = useState<Array<Poll>>([]);
  const [prefetch, setPrefetch] = useState<ThreadPrefetch>({});
  const [recentlyEdited, setRecentlyEdited] = useState(false);
  const [savedEdits, setSavedEdits] = useState('');
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState(false);
  const [thread, setThread] = useState<Thread>(null);
  const [threadFetched, setThreadFetched] = useState(false);
  const [threadFetchFailed, setThreadFetchFailed] = useState(false);
  const [title, setTitle] = useState('');
  const [viewCount, setViewCount] = useState(null);
  const [initializedComments, setInitializedComments] = useState(false);
  const [initializedPolls, setInitializedPolls] = useState(false);
  const [isChangeTopicModalOpen, setIsChangeTopicModalOpen] = useState(false);
  const [isEditCollaboratorsModalOpen, setIsEditCollaboratorsModalOpen] =
    useState(false);

  const threadId = identifier.split('-')[0];
  const threadIdAndType = `${threadId}-${ProposalType.Thread}`;
  const threadDoesNotMatch =
    +thread?.identifier !== +threadId || thread?.slug !== ProposalType.Thread;

  const updatedCommentsCallback = useCallback(() => {
    if (!thread) {
      return;
    }

    const _comments =
      app.comments
        .getByProposal(thread)
        .filter((c) => c.parentComment === null) || [];
    setComments(_comments);
  }, [thread]);

  // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
  if (!prefetch[threadIdAndType]) {
    setPrefetch((prevState) => ({
      ...prevState,
      [threadIdAndType]: {
        commentsStarted: false,
        pollsStarted: false,
        viewCountStarted: false,
        profilesStarted: false,
        profilesFinished: false,
      },
    }));
  }

  useEffect(() => {
    if (recentlyEdited) {
      setRecentlyEdited(false);
    }
  }, [recentlyEdited]);

  useEffect(() => {
    // load thread, and return PageLoading
    if (!thread || recentlyEdited) {
      try {
        const _thread = idToProposal(ProposalType.Thread, threadId);
        if (_thread === undefined) {
          throw new Error();
        }
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
    }
  }, [recentlyEdited, thread, threadFetched, threadId]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    // load proposal
    if (!prefetch[threadIdAndType]['threadReactionsStarted']) {
      app.threads.fetchReactionsCount([thread]).then(() => {
        setThread(thread);
      });
      setPrefetch((prevState) => ({
        ...prevState,
        [threadIdAndType]: {
          ...prevState[threadIdAndType],
          threadReactionsStarted: true,
        },
      }));
    }
  }, [prefetch, thread, threadIdAndType]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    if (thread && identifier !== `${threadId}-${slugify(thread?.title)}`) {
      const url = getProposalUrlPath(
        thread.slug,
        `${threadId}-${slugify(thread?.title)}`,
        true
      );
      navigate(url, { replace: true });
    }
  }, [identifier, navigate, thread, thread?.slug, thread?.title, threadId]);

  useEffect(() => {
    if (!thread) {
      return;
    }

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

      setPrefetch((prevState) => ({
        ...prevState,
        [threadIdAndType]: {
          ...prevState[threadIdAndType],
          commentsStarted: true,
        },
      }));
    }
  }, [prefetch, thread, threadId, threadIdAndType]);

  useEffect(() => {
    if (!initializedComments) {
      setInitializedComments(true);
      updatedCommentsCallback();
    }
  }, [initializedComments, updatedCommentsCallback]);

  useEffect(() => {
    if (!initializedPolls) {
      setInitializedPolls(true);
      setPolls(app.polls.getByThreadId(thread?.id));
    }
  }, [initializedPolls, thread?.id]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    // load polls
    if (!prefetch[threadIdAndType]['pollsStarted']) {
      app.polls
        .fetchPolls(app.activeChainId(), thread?.id)
        .then(() => {
          setPolls(app.polls.getByThreadId(thread.id));
        })
        .catch(() => {
          notifyError('Failed to load polls');
          setPolls([]);
        });

      setPrefetch((prevState) => ({
        ...prevState,
        [threadIdAndType]: {
          ...prevState[threadIdAndType],
          pollsStarted: true,
        },
      }));
    }
  }, [prefetch, thread, thread?.id, threadIdAndType]);

  useEffect(() => {
    if (!thread) {
      return;
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

      setPrefetch((prevState) => ({
        ...prevState,
        [threadIdAndType]: {
          ...prevState[threadIdAndType],
          viewCountStarted: true,
        },
      }));
    }
  }, [prefetch, thread, thread?.id, threadIdAndType]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    // load profiles
    if (!prefetch[threadIdAndType]['profilesStarted']) {
      app.profiles.getProfile(thread.authorChain, thread.author);

      comments.forEach((comment) => {
        app.profiles.getProfile(comment.authorChain, comment.author);
      });

      app.profiles.isFetched.on('redraw', () => {
        if (!prefetch[threadIdAndType]['profilesFinished']) {
          setPrefetch((prevState) => ({
            ...prevState,
            [threadIdAndType]: {
              ...prevState[threadIdAndType],
              profilesFinished: true,
            },
          }));
        }
      });

      setPrefetch((prevState) => ({
        ...prevState,
        [threadIdAndType]: {
          ...prevState[threadIdAndType],
          profilesStarted: true,
        },
      }));
    }
  }, [
    comments,
    prefetch,
    thread,
    thread?.author,
    thread?.authorChain,
    threadIdAndType,
  ]);

  useEffect(() => {
    if (threadDoesNotMatch) {
      setThread(undefined);
      setRecentlyEdited(false);
      setThreadFetched(false);
    }
  }, [threadDoesNotMatch]);

  useEffect(() => {
    if (comments?.length > 0) {
      const mismatchedComments = comments.filter((c) => {
        return c.rootProposal !== `${ProposalType.Thread}_${threadId}`;
      });

      if (mismatchedComments.length) {
        setPrefetch((prevState) => ({
          ...prevState,
          [threadIdAndType]: {
            ...prevState[threadIdAndType],
            commentsStarted: false,
          },
        }));
      }
    }
  }, [comments, threadId, threadIdAndType]);

  if (typeof identifier !== 'string') {
    return <PageNotFound />;
  }

  if (!app.chain?.meta) {
    return <PageLoading />;
  }

  // load app controller
  if (!app.threads.initialized) {
    return <PageLoading />;
  }

  if (threadFetchFailed) {
    return <PageNotFound />;
  }

  if (
    !app.profiles.allLoaded() &&
    !prefetch[threadIdAndType]['profilesFinished']
  ) {
    return <PageLoading />;
  }

  if (!thread) {
    return <PageLoading />;
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
                  const confirmation = window.confirm(
                    'Previous changes found. Restore edits?'
                  );
                  setShouldRestoreEdits(confirmation);
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
              onClick: () => {
                setIsEditCollaboratorsModalOpen(true);
              },
            },
          ]
        : []),
      ...(isAdminOrMod || isAuthor
        ? [
            {
              label: 'Change topic',
              iconLeft: 'write' as const,
              onClick: () => {
                setIsChangeTopicModalOpen(true);
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

                const confirmed = window.confirm('Delete this entire thread?');

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
    <Sublayout>
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
                <CollapsibleThreadBody thread={thread} />
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
      <Modal
        content={
          <ChangeTopicModal
            onChangeHandler={(topic: Topic) => {
              thread.topic = topic;
              setThread(thread);
            }}
            thread={thread}
            onModalClose={() => setIsChangeTopicModalOpen(false)}
          />
        }
        onClose={() => setIsChangeTopicModalOpen(false)}
        open={isChangeTopicModalOpen}
      />
      <Modal
        content={
          <EditCollaboratorsModal
            onModalClose={() => setIsEditCollaboratorsModalOpen(false)}
            thread={thread}
            onCollaboratorsUpdated={(newEditors: IThreadCollaborator[]) => {
              thread.collaborators = newEditors;
              setThread(thread);
            }}
          />
        }
        onClose={() => setIsEditCollaboratorsModalOpen(false)}
        open={isEditCollaboratorsModalOpen}
      />
    </Sublayout>
  );
};

export default ViewThreadPage;
