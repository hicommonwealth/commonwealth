import { ProposalType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { extractDomain, isDefaultStage } from 'helpers';
import { filterLinks } from 'helpers/threads';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'hooks/useBrowserWindow';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { getProposalUrlPath } from 'identifiers';
import $ from 'jquery';
import ReactionCount from 'models/ReactionCount';
import type { IThreadCollaborator } from 'models/Thread';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/view_thread/index.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { useFetchCommentsQuery } from 'state/api/comments';
import { fetchReactionCounts } from 'state/api/reactionCounts';
import { ContentType } from 'types';
import { slugify } from 'utils';
import ExternalLink from 'views/components/ExternalLink';
import useJoinCommunity from 'views/components/Header/useJoinCommunity';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import { PageNotFound } from 'views/pages/404';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import NewProfilesController from '../../../controllers/server/newProfiles';
import Poll from '../../../models/Poll';
import { Link, LinkSource, Thread } from '../../../models/Thread';
import Topic from '../../../models/Topic';
import {
  CommentsFeaturedFilterTypes,
  ThreadStage,
} from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { CreateComment } from '../../components/Comments/CreateComment';
import { Select } from '../../components/Select';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import type { SidebarComponents } from '../../components/component_kit/cw_content_page';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { CommentTree } from '../discussions/CommentTree';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import { EditBody } from './edit_body';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { LockMessage } from './lock_message';
import { ThreadPollCard, ThreadPollEditorCard } from './poll_cards';
import { SnapshotCreationCard } from './snapshot_creation_card';

export type ThreadPrefetch = {
  [identifier: string]: {
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
  const [viewCount, setViewCount] = useState<number>(null);
  const [initializedComments, setInitializedComments] = useState(false);
  const [initializedPolls, setInitializedPolls] = useState(false);
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [commentSortType, setCommentSortType] =
    useState<CommentsFeaturedFilterTypes>(CommentsFeaturedFilterTypes.Newest);
  const [isReplying, setIsReplying] = useState(false);
  const [parentCommentId, setParentCommentId] = useState<number>(null);
  const [threadFetchCompleted, setThreadFetchCompleted] = useState(false);

  const threadId = identifier.split('-')[0];
  const threadDoesNotMatch =
    +thread?.identifier !== +threadId || thread?.slug !== ProposalType.Thread;

  const { data: comments = [], error: fetchCommentsError } =
    useFetchCommentsQuery({
      chainId: app.activeChainId(),
      threadId: parseInt(`${threadId}`),
    });

  useEffect(() => {
    if (fetchCommentsError) notifyError('Failed to load comments');
  }, [fetchCommentsError]);

  const cancelEditing = () => {
    setIsGloballyEditing(false);
    setIsEditingBody(false);
  };

  const { isWindowMedium } = useBrowserWindow({
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

  useEffect(() => {
    breakpointFnValidator(
      isCollapsedSize,
      (state: boolean) => {
        setIsCollapsedSize(state);
      },
      isWindowMediumSmallInclusive
    );
  }, []);

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

  // we will want to prefetch comments, profiles, and viewCount on the page before rendering anything
  if (!prefetch[threadId]) {
    setPrefetch((prevState) => ({
      ...prevState,
      [threadId]: {
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

  useNecessaryEffect(() => {
    app.threads
      .fetchThreadsFromId([+threadId])
      .then((res) => {
        const t = res[0];
        if (t) setThread(t);
        setThreadFetchCompleted(true);
      })
      .catch(() => {
        notifyError('Thread not found');
        setThreadFetchFailed(true);
        setThreadFetchCompleted(true);
      });
  }, [threadId]);

  useNecessaryEffect(() => {
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

  useNecessaryEffect(() => {
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

  useNecessaryEffect(() => {
    if (comments.length > 0 && thread && thread.id) {
      fetchReactionCounts({
        proposalIds: [`${thread.id}`],
        commentIds: comments.map((c) => `${c.id}`),
        address: app.user.activeAccount?.address,
      }).then((reactionCounts) => {
        for (const rc of reactionCounts) {
          const id = app.threads.reactionCountsStore.getIdentifier({
            threadId: rc.thread_id,
            proposalId: rc.proposal_id,
            commentId: rc.comment_id,
          });

          app.threads.reactionCountsStore.add(
            new ReactionCount({ ...rc, id } as any)
          );

          app.threads.isReactionFetched.emit('redraw', rc.comment_id);
        }
      });
    }
  }, [thread, threadId, comments]);

  useEffect(() => {
    if (!initializedComments) {
      setInitializedComments(true);
    }
  }, [initializedComments]);

  useEffect(() => {
    if (!initializedPolls) {
      setInitializedPolls(true);
      setPolls(app.polls.getByThreadId(thread?.id));
    }
  }, [initializedPolls, thread?.id]);

  useNecessaryEffect(() => {
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

  useNecessaryEffect(() => {
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

  useNecessaryEffect(() => {
    if (!thread) {
      return;
    }

    // load profiles
    if (!prefetch[threadId]['profilesStarted']) {
      NewProfilesController.Instance.getProfile(
        thread.authorChain,
        thread.author
      );

      comments.forEach((comment) => {
        NewProfilesController.Instance.getProfile(
          comment.authorChain,
          comment.author
        );
      });

      NewProfilesController.Instance.isFetched.on('redraw', () => {
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
          },
        }));
      }
    }
  }, [comments, thread, threadId]);

  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();

  if (typeof identifier !== 'string' || threadFetchFailed) {
    return <PageNotFound />;
  }

  if (!app.chain?.meta || !app.threads.initialized || !thread) {
    return <CWContentPage showSkeleton isWindowMedium={isWindowMedium} />;
  }

  if (typeof identifier !== 'string') {
    return <PageNotFound />;
  }

  if (!thread && threadFetchCompleted) {
    return <PageNotFound />;
  }

  if (threadFetchFailed) {
    return <PageNotFound />;
  }

  // Original posters have full editorial control, while added collaborators
  // merely have access to the body and title
  const isAuthor = Permissions.isThreadAuthor(thread);
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);
  const linkedThreads = filterLinks(thread.links, LinkSource.Thread);

  const showLinkedProposalOptions =
    linkedSnapshots.length > 0 ||
    linkedProposals.length > 0 ||
    isAuthor ||
    isAdminOrMod;

  // Todo who should actually be able to view this
  const canCreateSnapshotProposal =
    app.chain?.meta?.snapshot?.length > 0 && (isAuthor || isAdminOrMod);

  const showLinkedThreadOptions =
    linkedThreads.length > 0 || isAuthor || isAdminOrMod;

  const hasSnapshotProposal = thread.links.find((x) => x.source === 'snapshot');

  const canComment =
    !!hasJoinedCommunity ||
    (!isAdminOrMod && app.chain.isGatedTopic(thread?.topic?.id));

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

  const handleNewSnapshotChange = async ({
    id,
    snapshot_title,
  }: {
    id: string;
    snapshot_title: string;
  }) => {
    const newLink: Link = {
      source: LinkSource.Snapshot,
      identifier: id,
      title: snapshot_title,
    };
    const toAdd = [newLink]; // Add this line to create an array with the new link

    if (toAdd.length > 0) {
      await app.threads.addLinks({
        threadId: thread.id,
        links: toAdd,
      });
    }

    const newThread = {
      ...thread,
      links: [...thread.links, newLink],
    } as Thread;

    setThread(newThread);
  };

  const editsToSave = localStorage.getItem(
    `${app.activeChainId()}-edit-thread-${thread.id}-storedText`
  );
  const isStageDefault = isDefaultStage(thread.stage);

  const tabsShouldBePresent =
    showLinkedProposalOptions || showLinkedThreadOptions || polls?.length > 0;

  const sortedComments = [...comments]
    .filter((c) => !c.parentComment)
    .sort((a, b) =>
      commentSortType === CommentsFeaturedFilterTypes.Oldest
        ? moment(a.createdAt).diff(moment(b.createdAt))
        : moment(b.createdAt).diff(moment(a.createdAt))
    );

  const showBanner = !hasJoinedCommunity && isBannerVisible;
  const fromDiscordBot =
    thread.discord_meta !== null && thread.discord_meta !== undefined;

  const showLocked =
    (thread.readOnly && !thread.markedAsSpamAt) || fromDiscordBot;

  const canUpdateThread =
    isLoggedIn &&
    (Permissions.isSiteAdmin() ||
      Permissions.isThreadAuthor(thread) ||
      Permissions.isThreadCollaborator(thread) ||
      (fromDiscordBot && isAdmin));

  return (
    <>
      <CWContentPage
        showTabs={isCollapsedSize && tabsShouldBePresent}
        contentBodyLabel="Thread"
        showSidebar={
          showLinkedProposalOptions ||
          showLinkedThreadOptions ||
          polls?.length > 0 ||
          isAuthor
        }
        isSpamThread={!!thread.markedAsSpamAt}
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
        isEditing={isEditingBody}
        author={app.chain.accounts.get(thread.author)}
        discord_meta={thread.discord_meta}
        collaborators={thread.collaborators}
        createdAt={thread.createdAt}
        updatedAt={thread.updatedAt}
        lastEdited={thread.lastEdited}
        viewCount={viewCount}
        canUpdateThread={canUpdateThread}
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
        onSpamToggle={(updatedThread) => {
          setIsGloballyEditing(false);
          setIsEditingBody(false);
          setRecentlyEdited(true);
          setThread((t) => ({
            ...t,
            markedAsSpamAt: updatedThread.markedAsSpamAt,
            uniqueIdentifier: t.uniqueIdentifier,
          }));
        }}
        onProposalStageChange={(stage) => {
          setThread((t) => ({
            ...t,
            stage: stage,
            uniqueIdentifier: t.uniqueIdentifier,
          }));
        }}
        hasPendingEdits={!!editsToSave}
        body={(threadOptionsComp) => (
          <div className="thread-content">
            {isEditingBody ? (
              <>
                {/*// TODO editing thread */}
                <EditBody
                  title={title}
                  thread={thread}
                  savedEdits={savedEdits}
                  shouldRestoreEdits={shouldRestoreEdits}
                  cancelEditing={cancelEditing}
                  threadUpdatedCallback={threadUpdatedCallback}
                />
                {threadOptionsComp}
              </>
            ) : (
              <>
                <QuillRenderer doc={thread.body} cutoffLines={50} />
                {thread.readOnly || fromDiscordBot ? (
                  <>
                    {threadOptionsComp}
                    {!thread.readOnly && thread.markedAsSpamAt && (
                      <div className="callout-text">
                        <CWIcon
                          iconName="flag"
                          weight="fill"
                          iconSize="small"
                        />
                        <CWText type="h5">
                          This thread was flagged as spam on{' '}
                          {moment(thread.createdAt).format('DD/MM/YYYY')},
                          meaning it can no longer be edited or commented on.
                        </CWText>
                      </div>
                    )}
                    {showLocked && (
                      <LockMessage
                        lockedAt={thread.lockedAt}
                        updatedAt={thread.updatedAt}
                        fromDiscordBot={fromDiscordBot}
                      />
                    )}
                  </>
                ) : !isGloballyEditing && isLoggedIn ? (
                  <>
                    {threadOptionsComp}
                    <CreateComment
                      rootThread={thread}
                      canComment={canComment}
                    />
                    {showBanner && (
                      <JoinCommunityBanner
                        onClose={handleCloseBanner}
                        onJoin={handleJoinCommunity}
                      />
                    )}
                  </>
                ) : null}
              </>
            )}
          </div>
        )}
        comments={
          <>
            {comments.length > 0 && (
              <div className="comments-filter-row">
                <Select
                  key={commentSortType}
                  size="compact"
                  selected={commentSortType}
                  onSelect={(item: any) => {
                    setCommentSortType(item.value);
                  }}
                  options={[
                    {
                      id: 1,
                      value: CommentsFeaturedFilterTypes.Newest,
                      label: 'Newest',
                      iconLeft: 'sparkle',
                    },
                    {
                      id: 2,
                      value: CommentsFeaturedFilterTypes.Oldest,
                      label: 'Oldest',
                      iconLeft: 'clockCounterClockwise',
                    },
                  ]}
                />
                <CWCheckbox
                  checked={includeSpamThreads}
                  label="Include comments flagged as spam"
                  onChange={(e) => setIncludeSpamThreads(e.target.checked)}
                />
              </div>
            )}
            <CommentTree
              comments={sortedComments}
              includeSpams={includeSpamThreads}
              thread={thread}
              setIsGloballyEditing={setIsGloballyEditing}
              isReplying={isReplying}
              setIsReplying={setIsReplying}
              parentCommentId={parentCommentId}
              setParentCommentId={setParentCommentId}
              canComment={canComment}
              fromDiscordBot={fromDiscordBot}
            />
          </>
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
            ...(canCreateSnapshotProposal && !hasSnapshotProposal
              ? [
                  {
                    label: 'Snapshot',
                    item: (
                      <div className="cards-column">
                        <SnapshotCreationCard
                          thread={thread}
                          allowSnapshotCreation={isAuthor || isAdminOrMod}
                          onChangeHandler={handleNewSnapshotChange}
                        />
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
      {JoinCommunityModals}
    </>
  );
};

export default ViewThreadPage;
