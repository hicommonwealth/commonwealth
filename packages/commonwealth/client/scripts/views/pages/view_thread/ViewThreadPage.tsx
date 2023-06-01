import { ProposalType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { modelFromServer as modelReactionCountFromServer } from 'controllers/server/reactionCounts';
import { extractDomain, isDefaultStage } from 'helpers';
import { filterLinks } from 'helpers/threads';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { getProposalUrlPath } from 'identifiers';
import $ from 'jquery';
import type { IThreadCollaborator } from 'models/Thread';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/view_thread/index.scss';
import React, { useCallback, useEffect, useState } from 'react';
import app from 'state';
import { ContentType } from 'types';
import { slugify } from 'utils';
import ExternalLink from 'views/components/ExternalLink';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/Sublayout';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import Permissions from '../../../lib/Permissions';
import Comment from '../../../models/Comment';
import Poll from '../../../models/Poll';
import { Link, LinkSource, Thread } from '../../../models/Thread';
import Topic from '../../../models/Topic';
import { ThreadStage } from '../../../models/types';
import { CommentsTree } from '../../components/Comments/CommentsTree';
import { CreateComment } from '../../components/Comments/CreateComment';
import { clearEditingLocalStorage } from '../../components/Comments/helpers';
import type { SidebarComponents } from '../../components/component_kit/cw_content_page';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { EditBody } from './edit_body';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { ThreadPollCard, ThreadPollEditorCard } from './poll_cards';

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
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);

  const threadId = identifier.split('-')[0];
  const threadDoesNotMatch =
    +thread?.identifier !== +threadId || thread?.slug !== ProposalType.Thread;

  const cancelEditing = () => {
    setIsGloballyEditing(false);
    setIsEditingBody(false);
  };

  useBrowserWindow({
    onResize: () =>
      breakpointFnValidator(
        isCollapsedSize,
        (state: boolean) => {
          setIsCollapsedSize(state);
        },
        isWindowMediumSmallInclusive
      ),
    resizeListenerUpdateDeps: [isCollapsedSize],
  });

  useBrowserAnalyticsTrack({
    payload: { event: MixpanelPageViewEvent.THREAD_PAGE_VIEW },
  });

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
    const timerId = setTimeout(() => {
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
    });

    return () => clearTimeout(timerId);
  }, [threadId]);

  useEffect(() => {
    const timerId = setTimeout(() => {
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
    });

    return () => clearTimeout(timerId);
  }, [prefetch, thread, threadId]);

  useEffect(() => {
    const timerId = setTimeout(() => {
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
    });

    return () => clearTimeout(timerId);
  }, [identifier, navigate, thread, thread?.slug, thread?.title, threadId]);

  useEffect(() => {
    const timerId = setTimeout(() => {
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
    });

    return () => clearTimeout(timerId);
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
    const timerId = setTimeout(() => {
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
    });

    return () => clearTimeout(timerId);
  }, [prefetch, thread, thread?.id, threadId]);

  useEffect(() => {
    const timerId = setTimeout(() => {
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
    });

    return () => clearTimeout(timerId);
  }, [prefetch, thread, thread?.id, threadId]);

  useEffect(() => {
    const timerId = setTimeout(() => {
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
    });

    return () => clearTimeout(timerId);
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

  // Original posters have full editorial control, while added collaborators
  // merely have access to the body and title
  const { activeAccount } = app.user;

  const isAuthor =
    activeAccount?.address === thread.author &&
    activeAccount?.chain.id === thread.authorChain;

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

  const editsToSave = localStorage.getItem(
    `${app.activeChainId()}-edit-thread-${thread.id}-storedText`
  );
  const isStageDefault = isDefaultStage(thread.stage);

  const tabsShouldBePresent =
    showLinkedProposalOptions || showLinkedThreadOptions || polls?.length > 0;

  return (
    <Sublayout>
      <CWContentPage
        showTabs={isCollapsedSize && tabsShouldBePresent}
        contentBodyLabel="Thread"
        showSidebar={
          showLinkedProposalOptions ||
          showLinkedThreadOptions ||
          polls?.length > 0 ||
          isAuthor
        }
        isSpamThread={thread.isSpam}
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
        author={app.chain.accounts.get(thread.author)}
        collaborators={thread.collaborators}
        createdAt={thread.createdAt}
        lastEdited={thread.lastEdited}
        viewCount={viewCount}
        canUpdateThread={
          isLoggedIn &&
          (Permissions.isSiteAdmin() ||
            Permissions.isThreadAuthor(thread) ||
            Permissions.isThreadCollaborator(thread))
        }
        displayNewTag={true}
        stageLabel={!isStageDefault && thread.stage}
        subHeader={
          !!thread.url && (
            <ExternalLink url={thread.url}>
              {extractDomain(thread.url)}
            </ExternalLink>
          )
        }
        thread={thread}
        onLockToggle={(isLock) => {
          setIsGloballyEditing(false);
          setIsEditingBody(false);
          setRecentlyEdited(true);
          setThread((t) => ({
            ...t,
            readOnly: isLock,
            uniqueIdentifier: t.uniqueIdentifier,
          }));
        }}
        onPinToggle={(isPin) => {
          setThread((t) => ({
            ...t,
            pinned: isPin,
            uniqueIdentifier: t.uniqueIdentifier,
          }));
        }}
        onTopicChange={(topic: Topic) => {
          const newThread = new Thread({ ...thread, topic });
          setThread(newThread);
        }}
        onCollaboratorsEdit={(collaborators: IThreadCollaborator[]) => {
          const newThread = new Thread({ ...thread, collaborators });
          setThread(newThread);
        }}
        onDelete={() => navigate('/discussions')}
        onEditCancel={() => {
          setIsGloballyEditing(true);
          setIsEditingBody(true);
        }}
        onEditConfirm={() => {
          setShouldRestoreEdits(true);
          setIsGloballyEditing(true);
          setIsEditingBody(true);
        }}
        onEditStart={() => {
          if (editsToSave) {
            clearEditingLocalStorage(thread.id, ContentType.Thread);

            setSavedEdits(editsToSave || '');
          }

          setIsGloballyEditing(true);
          setIsEditingBody(true);
        }}
        hasPendingEdits={!!editsToSave}
        body={(threadOptionsComp) => (
          <div className="thread-content">
            {isEditingBody ? (
              <>
                {threadOptionsComp}
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
                    {threadOptionsComp}
                    <CreateComment
                      updatedCommentsCallback={updatedCommentsCallback}
                      rootThread={thread}
                    />
                  </>
                ) : null}
              </>
            )}
          </div>
        )}
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
                              showDeleteButton={isAuthor || isAdmin}
                              onDelete={() => {
                                setInitializedPolls(false);
                              }}
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
    </Sublayout>
  );
};

export default ViewThreadPage;
