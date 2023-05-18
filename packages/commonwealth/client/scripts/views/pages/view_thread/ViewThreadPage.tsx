import { ProposalType } from 'common-common/src/types';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { getProposalUrlPath } from 'identifiers';
import $ from 'jquery';
import { ThreadStage } from '../../../models/types';

import { Link, LinkSource, Thread } from '../../../models/Thread';
import type { IThreadCollaborator } from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';

import 'pages/view_thread/index.scss';
import React, { useCallback, useEffect, useState } from 'react';

import app from 'state';
import { ContentType } from 'types';
import { slugify } from 'utils';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/Sublayout';
import Comment from '../../../models/Comment';
import Poll from '../../../models/Poll';
import Topic from '../../../models/Topic';
import { CommentsTree } from '../../components/Comments/CommentsTree';
import { CreateComment } from '../../components/Comments/CreateComment';
import { clearEditingLocalStorage } from '../../components/Comments/helpers';
import type { SidebarComponents } from '../../components/component_kit/cw_content_page';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { Modal } from '../../components/component_kit/cw_modal';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ThreadReactionPreviewButtonSmall } from '../../components/reaction_button/ThreadPreviewReactionButtonSmall';
import { ChangeTopicModal } from '../../modals/change_topic_modal';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import {
  getCommentSubscription,
  getReactionSubscription,
  handleToggleSubscription,
} from '../discussions/helpers';
import { EditBody } from './edit_body';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { ThreadPollCard, ThreadPollEditorCard } from './poll_cards';
import {
  ExternalLink,
  ThreadAuthor,
  ThreadStageComponent,
} from './thread_components';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { PopoverMenuItem } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { filterLinks } from 'helpers/threads';
import { isDefaultStage } from 'helpers';

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
  const { isLoggedIn } = useUserLoggedIn();

  const [comments, setComments] = useState<Array<Comment<Thread>>>([]);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isGloballyEditing, setIsGloballyEditing] = useState(false);
  const [polls, setPolls] = useState<Array<Poll>>([]);
  const [prefetch, setPrefetch] = useState<ThreadPrefetch>({});
  const [recentlyEdited, setRecentlyEdited] = useState(false);
  const [savedEdits, setSavedEdits] = useState('');
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState(false);
  const [thread, setThread] = useState<Thread>(null);
  const [threadFetchFailed, setThreadFetchFailed] = useState(false);
  const [title, setTitle] = useState('');
  const [viewCount, setViewCount] = useState(null);
  const [initializedComments, setInitializedComments] = useState(false);
  const [initializedPolls, setInitializedPolls] = useState(false);
  const [isChangeTopicModalOpen, setIsChangeTopicModalOpen] = useState(false);
  const [isEditCollaboratorsModalOpen, setIsEditCollaboratorsModalOpen] =
    useState(false);

  const threadId = identifier.split('-')[0];
  const threadDoesNotMatch =
    +thread?.identifier !== +threadId || thread?.slug !== ProposalType.Thread;

  const cancelEditing = () => {
    setIsGloballyEditing(false);
    setIsEditingBody(false);
  };

  const threadUpdatedCallback = (newTitle: string, body: string) => {
    setThread(
      new Thread({
        ...thread,
        title: newTitle,
        body: body,
      })
    );
    cancelEditing();
  };

  const updatedCommentsCallback = useCallback(() => {
    if (!thread) {
      return;
    }

    const _comments =
      app.comments
        .getByThread(thread)
        .filter((c) => c.parentComment === null) || [];
    setComments(_comments);
  }, [thread]);

  // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
  if (!prefetch[threadId]) {
    setPrefetch((prevState) => ({
      ...prevState,
      [threadId]: {
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
    app.threads
      .fetchThreadsFromId([+threadId])
      .then((res) => {
        const t = res[0];
        if (t) {
          const reactions = app.reactions.getByPost(t);
          t.associatedReactions = reactions
            .filter((r) => r.reaction === 'like')
            .map((r) => {
              return {
                id: r.id,
                type: 'like',
                address: r.author,
              };
            });

          setThread(t);
        }
      })
      .catch(() => {
        notifyError('Thread not found');
        setThreadFetchFailed(true);
      });
  }, [threadId]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    // load proposal
    if (!prefetch[threadId]['threadReactionsStarted']) {
      app.threads.fetchReactionsCount([thread]).then(() => {
        setThread(thread);
      });
      setPrefetch((prevState) => ({
        ...prevState,
        [threadId]: {
          ...prevState[threadId],
          threadReactionsStarted: true,
        },
      }));
    }
  }, [prefetch, thread, threadId]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    if (thread && identifier !== `${threadId}-${slugify(thread?.title)}`) {
      const url = getProposalUrlPath(
        thread.slug,
        `${threadId}-${slugify(thread?.title)}${window.location.search}`,
        true
      );
      navigate(url, { replace: true });
    }
  }, [identifier, navigate, thread, thread?.slug, thread?.title, threadId]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    if (!prefetch[threadId]['commentsStarted']) {
      app.comments
        .refresh(thread, app.activeChainId())
        .then(async () => {
          // fetch comments
          const _comments = app.comments
            .getByThread(thread)
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
                .getByThread(thread)
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
        [threadId]: {
          ...prevState[threadId],
          commentsStarted: true,
        },
      }));
    }
  }, [prefetch, thread, threadId]);

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
    if (!prefetch[threadId]['pollsStarted']) {
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
        [threadId]: {
          ...prevState[threadId],
          pollsStarted: true,
        },
      }));
    }
  }, [prefetch, thread, thread?.id, threadId]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    // load view count
    if (!prefetch[threadId]['viewCountStarted']) {
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
        [threadId]: {
          ...prevState[threadId],
          viewCountStarted: true,
        },
      }));
    }
  }, [prefetch, thread, thread?.id, threadId]);

  useEffect(() => {
    if (!thread) {
      return;
    }

    // load profiles
    if (!prefetch[threadId]['profilesStarted']) {
      app.newProfiles.getProfile(thread.authorChain, thread.author);

      comments.forEach((comment) => {
        app.newProfiles.getProfile(comment.authorChain, comment.author);
      });

      app.newProfiles.isFetched.on('redraw', () => {
        if (!prefetch[threadId]?.['profilesFinished']) {
          setPrefetch((prevState) => ({
            ...prevState,
            [threadId]: {
              ...prevState[threadId],
              profilesFinished: true,
            },
          }));
        }
      });

      setPrefetch((prevState) => ({
        ...prevState,
        [threadId]: {
          ...prevState[threadId],
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
    threadId,
  ]);

  useEffect(() => {
    if (threadDoesNotMatch) {
      setThread(undefined);
      setRecentlyEdited(false);
    }
  }, [threadDoesNotMatch]);

  useEffect(() => {
    if (thread?.id && comments?.length > 0) {
      const mismatchedComments = comments.filter((c) => {
        return c.threadId !== thread.id;
      });

      if (mismatchedComments.length) {
        setPrefetch((prevState) => ({
          ...prevState,
          [threadId]: {
            ...prevState[threadId],
            commentsStarted: false,
          },
        }));
      }
    }
  }, [comments, thread, threadId]);

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

  const isSubscribed =
    getCommentSubscription(thread)?.isActive &&
    getReactionSubscription(thread)?.isActive;

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);
  const linkedThreads = filterLinks(thread.links, LinkSource.Thread);

  const showLinkedProposalOptions =
    linkedSnapshots.length > 0 ||
    linkedProposals.length > 0 ||
    isAuthor ||
    isAdminOrMod;

  const showLinkedThreadOptions =
    linkedThreads.length > 0 || isAuthor || isAdminOrMod;

  const canComment =
    app.user.activeAccount ||
    (!isAdminOrMod && TopicGateCheck.isGatedTopic(thread?.topic?.name));

  const reactionsAndReplyButtons = (
    <div className="thread-footer-row">
      <ThreadReactionPreviewButtonSmall thread={thread} />
      <div className="comments-count">
        <CWIcon iconName="feedback" iconSize="small" />
        <CWText type="caption">{commentCount} Comments</CWText>
      </div>
    </div>
  );

  const hasEditPerms = isAuthor || isEditor;

  const handleLinkedThreadChange = (links: Thread['links']) => {
    const updatedThread = new Thread({
      ...thread,
      links,
    });

    setThread(updatedThread);
  };

  const handleLinkedProposalChange = (
    stage: ThreadStage,
    links: Link[] = []
  ) => {
    const newThread = {
      ...thread,
      stage,
      links,
    } as Thread;

    setThread(newThread);
  };

  const handleDeleteThread = () => {
    openConfirmation({
      title: 'Delete Thread',
      description: <>Delete this entire thread?</>,
      buttons: [
        {
          label: 'Delete',
          buttonType: 'mini-red',
          onClick: async () => {
            try {
              app.threads.delete(thread).then(() => {
                navigate('/discussions');
              });
            } catch (err) {
              console.log(err);
            }
          },
        },
        {
          label: 'Cancel',
          buttonType: 'mini-black',
        },
      ],
    });
  };

  const handleEditThread = async (e) => {
    e.preventDefault();
    const editsToSave = localStorage.getItem(
      `${app.activeChainId()}-edit-thread-${thread.id}-storedText`
    );

    if (editsToSave) {
      clearEditingLocalStorage(thread.id, ContentType.Thread);

      setSavedEdits(editsToSave || '');

      openConfirmation({
        title: 'Info',
        description: <>Previous changes found. Restore edits?</>,
        buttons: [
          {
            label: 'Restore',
            buttonType: 'mini-black',
            onClick: () => {
              setShouldRestoreEdits(true);
              setIsGloballyEditing(true);
              setIsEditingBody(true);
            },
          },
          {
            label: 'Cancel',
            buttonType: 'mini-white',
            onClick: () => {
              setIsGloballyEditing(true);
              setIsEditingBody(true);
            },
          },
        ],
      });
    } else {
      setIsGloballyEditing(true);
      setIsEditingBody(true);
    }
  };

  const getActionMenuItems = (): PopoverMenuItem[] => {
    return [
      ...(hasEditPerms && !thread.readOnly
        ? [
            {
              label: 'Edit',
              iconLeft: 'write' as const,
              onClick: handleEditThread,
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
              onClick: handleDeleteThread,
            },
          ]
        : []),
      ...(isAuthor || isAdminOrMod
        ? [
            {
              label: thread.readOnly ? 'Unlock thread' : 'Lock thread',
              iconLeft: 'lock' as const,
              onClick: () => {
                app.threads
                  .setPrivacy({
                    threadId: thread.id,
                    readOnly: !thread.readOnly,
                  })
                  .then(() => {
                    setIsGloballyEditing(false);
                    setIsEditingBody(false);
                    setRecentlyEdited(true);
                    notifySuccess(thread.readOnly ? 'Unlocked!' : 'Locked!');
                  });
                setThread(
                  new Thread({ ...thread, readOnly: !thread.readOnly })
                );
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
      {
        onClick: () => {
          handleToggleSubscription(
            thread,
            getCommentSubscription(thread),
            getReactionSubscription(thread),
            isSubscribed
          ).then(() => {
            setRecentlyEdited(true);
          });
        },
        label: isSubscribed ? 'Unsubscribe' : 'Subscribe',
        iconLeft: isSubscribed ? 'unsubscribe' : 'bell',
      },
    ];
  };

  const isStageDefault = isDefaultStage(thread.stage);

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
        author={
          <ThreadAuthor
            author={thread.author}
            collaborators={thread.collaborators}
          />
        }
        createdAt={thread.createdAt}
        viewCount={viewCount}
        readOnly={thread.readOnly}
        headerComponents={
          !isStageDefault && <ThreadStageComponent stage={thread.stage} />
        }
        subHeader={!!thread.url && <ExternalLink url={thread.url} />}
        actions={
          app.user.activeAccount && !isGloballyEditing && getActionMenuItems()
        }
        body={
          <div className="thread-content">
            {isEditingBody ? (
              <>
                {reactionsAndReplyButtons}
                <EditBody
                  title={title}
                  thread={thread}
                  savedEdits={savedEdits}
                  shouldRestoreEdits={shouldRestoreEdits}
                  cancelEditing={cancelEditing}
                  threadUpdatedCallback={threadUpdatedCallback}
                />
              </>
            ) : (
              <>
                <QuillRenderer doc={thread.body} cutoffLines={50} />
                {thread.readOnly ? (
                  <CWText type="h5" className="callout-text">
                    Commenting is disabled because this post has been locked.
                  </CWText>
                ) : !isGloballyEditing && canComment && isLoggedIn ? (
                  <>
                    {reactionsAndReplyButtons}
                    <CreateComment
                      updatedCommentsCallback={updatedCommentsCallback}
                      rootThread={thread}
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
            thread={thread}
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
                            onChangeHandler={handleLinkedProposalChange}
                            thread={thread}
                            showAddProposalButton={isAuthor || isAdminOrMod}
                          />
                        )}
                        {showLinkedThreadOptions && (
                          <LinkedThreadsCard
                            thread={thread}
                            allowLinking={isAuthor || isAdminOrMod}
                            onChangeHandler={handleLinkedThreadChange}
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
                          return (
                            <ThreadPollCard
                              poll={poll}
                              key={poll.id}
                              onVote={() => setInitializedPolls(false)}
                            />
                          );
                        })}
                        {isAuthor &&
                          (!app.chain?.meta?.adminOnlyPolling || isAdmin) && (
                            <ThreadPollEditorCard
                              thread={thread}
                              threadAlreadyHasPolling={!polls?.length}
                              onPollCreate={() => setInitializedPolls(false)}
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
              const newThread = new Thread({ ...thread, topic });
              setThread(newThread);
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
            onCollaboratorsUpdated={(collaborators: IThreadCollaborator[]) => {
              const newThread = new Thread({ ...thread, collaborators });
              setThread(newThread);
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
