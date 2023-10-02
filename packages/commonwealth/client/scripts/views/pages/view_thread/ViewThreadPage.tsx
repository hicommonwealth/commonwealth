import axios from 'axios';
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
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import app from 'state';
import { useFetchCommentsQuery } from 'state/api/comments';
import {
  useAddThreadLinksMutation,
  useGetThreadsByIdQuery,
} from 'state/api/threads';
import { ContentType } from 'types';
import { slugify } from 'utils';
import ExternalLink from 'views/components/ExternalLink';
import useJoinCommunity from 'views/components/Header/useJoinCommunity';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import { PageNotFound } from 'views/pages/404';
import { MixpanelPageViewEvent } from '../../../../../shared/analytics/types';
import useForceRerender from '../../../hooks/useForceRerender';
import Poll from '../../../models/Poll';
import { Link, LinkSource } from '../../../models/Thread';
import { CommentsFeaturedFilterTypes } from '../../../models/types';
import Permissions from '../../../utils/Permissions';
import { CreateComment } from '../../components/Comments/CreateComment';
import { CWCard } from '../../components/component_kit/cw_card';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/VotingResults';
import { Select } from '../../components/Select';
import type { SidebarComponents } from '../../components/component_kit/CWContentPage';
import {
  CWContentPage,
  CWContentPageCard,
} from '../../components/component_kit/CWContentPage';
import { CWCheckbox } from '../../components/component_kit/cw_checkbox';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../components/component_kit/cw_text';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { isMobile } from 'react-device-detect';

import {
  breakpointFnValidator,
  isWindowMediumSmallInclusive,
} from '../../components/component_kit/helpers';
import { QuillRenderer } from '../../components/react_quill_editor/quill_renderer';
import { CommentTree } from '../discussions/CommentTree';
import { clearEditingLocalStorage } from '../discussions/CommentTree/helpers';
import { useProposalData } from '../view_proposal/index';
import { useSnapshotProposalData } from '../view_snapshot_proposal/index';
import { SnapshotInformationCard } from '../view_snapshot_proposal/snapshot_information_card';
import { SnapshotPollCardContainer } from '../view_snapshot_proposal/snapshot_poll_card_container';
import { EditBody } from './edit_body';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { LockMessage } from './lock_message';
import { ThreadPollCard, ThreadPollEditorCard } from './poll_cards';
import { SnapshotCreationCard } from './snapshot_creation_card';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';

import 'pages/view_thread/index.scss';

type ViewThreadPageProps = {
  identifier: string;
};

const ViewThreadPage = ({ identifier }: ViewThreadPageProps) => {
  const threadId = identifier.split('-')[0];

  const navigate = useCommonNavigate();

  const { isLoggedIn } = useUserLoggedIn();
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isGloballyEditing, setIsGloballyEditing] = useState(false);
  const [polls, setPolls] = useState<Array<Poll>>([]);
  const [savedEdits, setSavedEdits] = useState('');
  const [shouldRestoreEdits, setShouldRestoreEdits] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [viewCount, setViewCount] = useState<number>(null);
  const [initializedPolls, setInitializedPolls] = useState(false);
  const [isCollapsedSize, setIsCollapsedSize] = useState(false);
  const [includeSpamThreads, setIncludeSpamThreads] = useState<boolean>(false);
  const [commentSortType, setCommentSortType] =
    useState<CommentsFeaturedFilterTypes>(CommentsFeaturedFilterTypes.Newest);
  const [isReplying, setIsReplying] = useState(false);
  const [parentCommentId, setParentCommentId] = useState<number>(null);
  const [arePollsFetched, setArePollsFetched] = useState(false);
  const [isViewMarked, setIsViewMarked] = useState(false);
  const [snapshotProposalId, setSnapshotProposalId] = useState(null);
  const [snapshotId, setSnapshotId] = useState(null);
  const [proposalId, setProposalId] = useState(null);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const toggleVotingModal = (newModalState: boolean) => {
    setVotingModalOpen(newModalState);
  };

  const onModalClose = () => {
    setVotingModalOpen(false);
  };

  const {
    snapshotProposal,
    proposalAuthor,
    votes,
    symbol,
    threads,
    activeUserAddress,
    power,
    space,
    totals,
    totalScore,
    validatedAgainstStrategies,
    loadVotes,
  } = useSnapshotProposalData(snapshotProposalId, snapshotId);

  const { proposal } = useProposalData(proposalId, null, proposalId != null);

  const forceRerender = useForceRerender();

  const proposalVotes = proposal?.getVotes();

  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();
  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { activeAccount: hasJoinedCommunity } = useUserActiveAccount();
  const [searchParams] = useSearchParams();
  const shouldFocusCommentEditor = !!searchParams.get('focusEditor');

  const {
    data,
    error: fetchThreadError,
    isLoading,
  } = useGetThreadsByIdQuery({
    chainId: app.activeChainId(),
    ids: [+threadId].filter(Boolean),
    apiCallEnabled: !!threadId, // only call the api if we have thread id
  });

  const thread = data?.[0];

  const { data: comments = [], error: fetchCommentsError } =
    useFetchCommentsQuery({
      chainId: app.activeChainId(),
      threadId: parseInt(`${threadId}`),
    });

  const { mutateAsync: addThreadLinks } = useAddThreadLinksMutation({
    chainId: app.activeChainId(),
    threadId: parseInt(threadId),
  });

  useEffect(() => {
    app.proposalEmitter.on('redraw', forceRerender);

    return () => {
      app.proposalEmitter.removeAllListeners();
    };
  }, [forceRerender]);

  useEffect(() => {
    if (fetchCommentsError) notifyError('Failed to load comments');
  }, [fetchCommentsError]);

  const { isWindowLarge } = useBrowserWindow({
    // const { isWindowMedium } = useBrowserWindow({
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

  useEffect(() => {
    if (!initializedPolls && thread?.id) {
      setInitializedPolls(true);
      setPolls(app.polls.getByThreadId(thread?.id));
    }
  }, [initializedPolls, thread?.id]);

  // TODO: unnecessary code - must be in a redirect hook
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
  // ------------

  useNecessaryEffect(() => {
    if (!thread || (thread && arePollsFetched)) {
      return;
    }

    app.polls
      .fetchPolls(app.activeChainId(), thread?.id)
      .then(() => {
        setPolls(app.polls.getByThreadId(thread.id));
        setArePollsFetched(true);
      })
      .catch(() => {
        notifyError('Failed to load polls');
        setPolls([]);
      });
  }, [thread, arePollsFetched]);

  useNecessaryEffect(() => {
    if (!thread || (thread && isViewMarked)) {
      return;
    }

    // load view count
    axios
      .post(`${app.serverUrl()}/viewCount`, {
        chain: app.activeChainId(),
        object_id: thread.id,
      })
      .then((response) => {
        setViewCount(response?.data?.result?.view_count || 0);
      })
      .catch(() => {
        setViewCount(0);
      })
      .finally(() => {
        setIsViewMarked(true);
      });
  }, [thread, isViewMarked]);

  useManageDocumentTitle('View thread', thread?.title);

  if (typeof identifier !== 'string') {
    return <PageNotFound />;
  }

  if (!app.chain?.meta || isLoading) {
    return (
      <CWContentPage
        showSkeleton
        sidebarComponentsSkeletonCount={isWindowLarge ? 2 : 0}
      />
    );
  }

  if ((!isLoading && !thread) || fetchThreadError) {
    return <PageNotFound />;
  }

  // Original posters have full editorial control, while added collaborators
  // merely have access to the body and title
  const isAuthor = Permissions.isThreadAuthor(thread);
  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();
  const isAdminOrMod = isAdmin || Permissions.isCommunityModerator();

  const linkedSnapshots = filterLinks(thread.links, LinkSource.Snapshot);
  if (linkedSnapshots?.length > 0 && !snapshotId) {
    setSnapshotId(linkedSnapshots[0].identifier.split('/')[0]);
    setSnapshotProposalId(linkedSnapshots[0].identifier.split('/')[1]);
  }
  const linkedProposals = filterLinks(thread.links, LinkSource.Proposal);
  if (linkedProposals?.length > 0 && !proposalId) {
    setProposalId(linkedProposals[0].identifier);
  }

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
      try {
        await addThreadLinks({
          chainId: app.activeChainId(),
          threadId: thread.id,
          links: toAdd,
        });
      } catch {
        notifyError('Failed to update linked threads');
        return;
      }
    }
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
  const fromBot = thread.bot_meta !== null && thread.bot_meta !== undefined;

  const showLocked = (thread.readOnly && !thread.markedAsSpamAt) || fromBot;

  const canUpdateThread =
    isLoggedIn &&
    (Permissions.isSiteAdmin() ||
      Permissions.isCommunityAdmin() ||
      Permissions.isCommunityModerator() ||
      Permissions.isThreadAuthor(thread) ||
      Permissions.isThreadCollaborator(thread) ||
      (fromBot && isAdmin));

  const sidebarComponents = [
    ...(showLinkedProposalOptions || showLinkedThreadOptions
      ? [
          {
            label: 'Links',
            item: (
              <div className="cards-column">
                <div className="cards-column">
                  {showLinkedProposalOptions && (
                    <LinkedProposalsCard
                      thread={thread}
                      showAddProposalButton={isAuthor || isAdminOrMod}
                    />
                  )}
                </div>
                <div className="cards-column">
                  {showLinkedThreadOptions && (
                    <LinkedThreadsCard
                      thread={thread}
                      allowLinking={isAuthor || isAdminOrMod}
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]
      : []),
    ...(snapshotProposal
      ? [
          {
            label: 'Info',
            item: (
              <div className="cards-column">
                <SnapshotInformationCard
                  proposal={snapshotProposal}
                  threads={threads}
                  header={'Snapshot Info'}
                />
              </div>
            ),
          },
          {
            label: 'Poll',
            item: (
              <div className="cards-column">
                <SnapshotPollCardContainer
                  activeUserAddress={activeUserAddress}
                  fetchedPower={!!power}
                  identifier={identifier}
                  proposal={snapshotProposal}
                  space={space}
                  symbol={symbol}
                  totals={totals}
                  totalScore={totalScore}
                  validatedAgainstStrategies={validatedAgainstStrategies}
                  votes={votes}
                  loadVotes={async () => loadVotes(snapshotId, identifier)}
                />
              </div>
            ),
          },
        ]
      : []),
    ...(proposal && proposalVotes?.length >= 0
      ? [
          {
            label: 'ProposalPoll',
            item: (
              <div className="cards-column">
                <CWContentPageCard
                  header={'Proposal Vote'}
                  content={
                    <CWCard className="PollCard">
                      <div className="poll-title-section">
                        <CWText type="b2" className="poll-title-text">
                          {proposal.title}
                        </CWText>
                      </div>
                      <VotingActions
                        onModalClose={onModalClose}
                        proposal={proposal}
                        toggleVotingModal={toggleVotingModal}
                        votingModalOpen={votingModalOpen}
                        isInCard={true}
                      />
                      <VotingResults proposal={proposal} isInCard={true} />
                    </CWCard>
                  }
                ></CWContentPageCard>
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
                  ...new Map(polls?.map((poll) => [poll.id, poll])).values(),
                ].map((poll: Poll) => {
                  const threadPollCard = (
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
                  return (
                    <CWContentPageCard
                      header="Thread Poll"
                      content={threadPollCard}
                    ></CWContentPageCard>
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
  ] as SidebarComponents;

  return (
    // TODO: the editing experience can be improved (we can remove a stale code and make it smooth) - create a ticket
    <>
      <CWContentPage
        showTabs={isCollapsedSize && tabsShouldBePresent && !isMobile}
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
                setDraftTitle(e.target.value);
              }}
              defaultValue={thread.title}
            />
          ) : (
            thread.title
          )
        }
        isEditing={isEditingBody}
        author={app.chain.accounts.get(thread.author)}
        bot_meta={thread.bot_meta}
        collaborators={thread.collaborators}
        createdAt={thread.createdAt}
        updatedAt={thread.updatedAt}
        lastEdited={thread.lastEdited}
        viewCount={viewCount}
        canUpdateThread={canUpdateThread}
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
        }}
        hasPendingEdits={!!editsToSave}
        body={(threadOptionsComp) => (
          <div className="thread-content">
            {isEditingBody ? (
              <>
                {/*// TODO editing thread */}
                <EditBody
                  title={draftTitle}
                  thread={thread}
                  savedEdits={savedEdits}
                  shouldRestoreEdits={shouldRestoreEdits}
                  cancelEditing={() => {
                    setIsGloballyEditing(false);
                    setIsEditingBody(false);
                  }}
                  threadUpdatedCallback={() => {
                    setIsGloballyEditing(false);
                    setIsEditingBody(false);
                  }}
                />
                {threadOptionsComp}
              </>
            ) : (
              <>
                <QuillRenderer
                  doc={thread.body}
                  cutoffLines={isMobile ? 10 : 50}
                />
                {isMobile && (
                  <div className="FooterCards">
                    {sidebarComponents.map((component) => {
                      return <div key={component.label}>{component.item}</div>;
                    })}
                  </div>
                )}

                {thread.readOnly || fromBot ? (
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
                        fromBot={fromBot}
                        botType={thread.bot_meta?.bot_type}
                      />
                    )}
                  </>
                ) : !isGloballyEditing && isLoggedIn ? (
                  <>
                    {threadOptionsComp}
                    <CreateComment
                      rootThread={thread}
                      canComment={canComment}
                      shouldFocusEditor={shouldFocusCommentEditor}
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
              fromDiscordBot={fromBot}
            />
          </>
        }
        sidebarComponents={isMobile ? [] : sidebarComponents}
      />
      {JoinCommunityModals}
    </>
  );
};

export default ViewThreadPage;
