import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import {
  canUserPerformGatedAction,
  GatedActionEnum,
} from '@hicommonwealth/shared';
import { notifyError } from 'controllers/app/notifications';
import { weightedVotingValueToLabel } from 'helpers';
import { detectURL } from 'helpers/threads';
import useJoinCommunityBanner from 'hooks/useJoinCommunityBanner';
import useTopicGating from 'hooks/useTopicGating';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import app from 'state';
import { useGetUserEthBalanceQuery } from 'state/api/communityStake';
import { useFetchGroupsQuery } from 'state/api/groups';
import { useCreateThreadMutation } from 'state/api/threads';
import { useFetchTopicsQuery } from 'state/api/topics';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import JoinCommunityBanner from 'views/components/JoinCommunityBanner';
import MarkdownEditor from 'views/components/MarkdownEditor';
import { MarkdownSubmitButton } from 'views/components/MarkdownEditor/MarkdownSubmitButton';
import { MarkdownEditorMethods } from 'views/components/MarkdownEditor/useMarkdownEditorMethods';
import CustomTopicOption from 'views/components/NewThreadFormLegacy/CustomTopicOption';
import useJoinCommunity from 'views/components/SublayoutHeader/useJoinCommunity';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { MessageRow } from 'views/components/component_kit/new_designs/CWTextInput/MessageRow';
import useCommunityContests from 'views/pages/CommunityManagement/Contests/useCommunityContests';
import useAppStatus from '../../../hooks/useAppStatus';
import { AnyProposal, ThreadKind } from '../../../models/types';
import { CWText } from '../../components/component_kit/cw_text';
import { useCosmosProposal } from '../../pages/NewProposalViewPage/useCosmosProposal';
import { useSnapshotProposal } from '../../pages/NewProposalViewPage/useSnapshotProposal';
import { LinkedProposalsCard } from '../../pages/view_thread/linked_proposals_card';
import { CWGatedTopicBanner } from '../component_kit/CWGatedTopicBanner';
import { CWSelectList } from '../component_kit/new_designs/CWSelectList';
import ContestThreadBanner from './ContestThreadBanner';

import {
  SnapshotProposal,
  SnapshotSpace,
} from 'client/scripts/helpers/snapshot_utils';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import useForceRerender from 'client/scripts/hooks/useForceRerender';
import { ExtendedPoll, LocalPoll } from 'utils/polls';
import ProposalVotesDrawer from '../../pages/NewProposalViewPage/ProposalVotesDrawer/ProposalVotesDrawer';
import { SnapshotPollCardContainer } from '../../pages/Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import { ThreadPollCard } from '../../pages/view_thread/ThreadPollCard';
import { ThreadPollEditorCard } from '../../pages/view_thread/ThreadPollEditorCard';
import DetailCard from '../proposals/DetailCard';
import TimeLineCard from '../proposals/TimeLineCard';
import VotingResultView from '../proposals/VotingResultView';
import { VotingActions } from '../proposals/voting_actions';
import { VotingResults } from '../proposals/voting_results';
import ContestTopicBanner from './ContestTopicBanner';
import './NewThreadForm.scss';
import { checkNewThreadErrors, useNewThreadForm } from './helpers';

const MIN_ETH_FOR_CONTEST_THREAD = 0.0;

export type ProposalState = {
  identifier: string;
  source: string;
  title: string;
  proposalId: string;
  snapshotIdentifier?: string;
};

export const NewThreadForm = () => {
  const location = useLocation();
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [showVotesDrawer, setShowVotesDrawer] = useState(false);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [proposalRedrawState, redrawProposals] = useState<boolean>(true);

  const [pollsData, setPollData] = useState<LocalPoll[]>();

  const markdownEditorMethodsRef = useRef<MarkdownEditorMethods | null>(null);

  useAppStatus();

  const communityId = app.activeChainId() || '';
  const { data: topics = [], refetch: refreshTopics } = useFetchTopicsQuery({
    communityId,
    includeContestData: true,
    apiEnabled: !!communityId,
  });

  const { isContestAvailable } = useCommunityContests();
  const forceRerender = useForceRerender();

  const sortedTopics = [...topics].sort((a, b) => a.name.localeCompare(b.name));
  const hasTopics = sortedTopics?.length;
  const topicsForSelector = hasTopics ? sortedTopics : [];

  const {
    threadTitle,
    setThreadTitle,
    threadKind,
    threadTopic,
    setThreadTopic,
    threadUrl,
    setThreadUrl,
    setEditorText,
    setIsSaving,
    isDisabled,
    canShowGatingBanner,
    setCanShowGatingBanner,
    canShowTopicPermissionBanner,
    setCanShowTopicPermissionBanner,
    editorText,
  } = useNewThreadForm(communityId, topicsForSelector);

  const hasTopicOngoingContest =
    threadTopic?.active_contest_managers?.length ?? 0 > 0;

  const user = useUserStore();

  const contestTopicError = threadTopic?.active_contest_managers?.length
    ? threadTopic?.active_contest_managers
        ?.map(
          (acm) =>
            acm?.content?.filter(
              (c) => c.actor_address === user.activeAccount?.address,
            ).length || 0,
        )
        ?.every((n) => n >= 2)
    : false;

  const { handleJoinCommunity, JoinCommunityModals } = useJoinCommunity();
  const { isBannerVisible, handleCloseBanner } = useJoinCommunityBanner();

  const { data: groups = [] } = useFetchGroupsQuery({
    communityId,
    includeTopics: true,
    enabled: !!communityId,
  });
  const { actionGroups, bypassGating, memberships } = useTopicGating({
    communityId,
    userAddress: user.activeAccount?.address || '',
    apiEnabled: !!user.activeAccount?.address && !!communityId,
    topicId: threadTopic?.id || 0,
  });

  const isAdmin = Permissions.isSiteAdmin() || Permissions.isCommunityAdmin();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mutateAsync: createThread } = useCreateThreadMutation({
    communityId,
  });

  const chainRpc = app?.chain?.meta?.ChainNode?.url || '';
  const ethChainId = app?.chain?.meta?.ChainNode?.eth_chain_id || 0;

  const { data: userEthBalance } = useGetUserEthBalanceQuery({
    chainRpc,
    walletAddress: user.activeAccount?.address || '',
    apiEnabled:
      isContestAvailable &&
      !!user.activeAccount?.address &&
      Number(ethChainId) > 0,
    ethChainId: ethChainId || 0,
  });

  const isDiscussion = threadKind === ThreadKind.Discussion;

  // eslint-disable-next-line @typescript-eslint/require-await
  const handleNewThreadCreation = async () => {
    const body = markdownEditorMethodsRef.current!.getMarkdown();

    if (
      canUserPerformGatedAction(
        actionGroups,
        GatedActionEnum.CREATE_THREAD,
        bypassGating,
      )
    ) {
      notifyError('Topic is gated!');
      return;
    }

    if (!isDiscussion && !detectURL(threadUrl)) {
      notifyError('Must provide a valid URL.');
      return;
    }

    checkNewThreadErrors(
      { threadKind, threadUrl, threadTitle, threadTopic },
      body,
      !!hasTopics,
    );

    setIsSaving(true);

    // try {
    //   const input = await buildCreateThreadInput({
    //     address: user.activeAccount?.address || '',
    //     kind: threadKind,
    //     stage: app.chain.meta?.custom_stages
    //       ? parseCustomStages(app.chain.meta?.custom_stages)[0]
    //       : ThreadStage.Discussion,
    //     communityId,
    //     title: threadTitle,
    //     topic: threadTopic,
    //     body,
    //     url: threadUrl,
    //   });
    //   const thread = await createThread(input);
    //
    //   setEditorText('');
    //   clearDraft();
    //
    //   navigate(`/discussion/${thread.id}`);
    // } catch (err) {
    //   if (err instanceof SessionKeyError) {
    //     checkForSessionKeyRevalidationErrors(err);
    //     return;
    //   }
    //
    //   if (err?.message?.includes('limit')) {
    //     notifyError(
    //       'Limit of submitted threads in selected contest has been exceeded.',
    //     );
    //     return;
    //   }
    //
    //   console.error(err?.message);
    //   notifyError('Failed to create thread');
    // } finally {
    //   setIsSaving(false);
    // }
  };

  const showBanner = !user.activeAccount && isBannerVisible;

  const permissions = Permissions.getCreateThreadPermission({
    actionGroups,
    bypassGating,
  });

  const contestThreadBannerVisible =
    isContestAvailable && hasTopicOngoingContest;

  const contestTopicAffordanceVisible =
    isContestAvailable && hasTopicOngoingContest;

  const isWalletBalanceErrorEnabled = false;
  const walletBalanceError =
    isContestAvailable &&
    hasTopicOngoingContest &&
    isWalletBalanceErrorEnabled &&
    parseFloat(userEthBalance || '0') < MIN_ETH_FOR_CONTEST_THREAD;

  useEffect(() => {
    refreshTopics().catch(console.error);
  }, [refreshTopics]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [linkedProposals, setLinkedProposals] =
    useState<ProposalState | null>();

  const snapshotLink = linkedProposals?.source === 'snapshot';
  const cosmosLink = linkedProposals?.source === 'proposal';
  const {
    proposal: snapshotProposal,
    symbol,
    votes,
    space,
    totals,
    totalScore,
    validatedAgainstStrategies,
    activeUserAddress,
    loadVotes,
    power,
    threads,
  } = useSnapshotProposal({
    identifier: linkedProposals?.proposalId || '',
    snapshotId: linkedProposals?.snapshotIdentifier || '',
    enabled: !!snapshotLink,
  });

  const { proposal, threads: cosmosThreads } = useCosmosProposal({
    proposalId: linkedProposals?.identifier || '',
    enabled: !!cosmosLink,
  });

  useEffect(() => {
    proposal?.isFetched?.once('redraw', forceRerender);

    return () => {
      proposal?.isFetched?.removeAllListeners();
    };
  }, [proposal, forceRerender]);

  const snapShotVotingResult = React.useMemo(() => {
    if (!snapshotProposal || !votes) return [];
    const { choices } = snapshotProposal;
    const totalVoteCount = totals.sumOfResultsBalance || 0;

    return choices.map((label: string, index: number) => {
      const voteCount = votes
        .filter((vote) => vote.choice === index + 1)
        .reduce((sum, vote) => sum + vote.balance, 0);
      const percentage =
        totalVoteCount > 0
          ? ((voteCount / totalVoteCount) * 100).toFixed(2)
          : '0';
      const results = voteCount.toFixed(4); // Adjust precision as needed

      return {
        label,
        percentage,
        results,
      };
    });
  }, [votes, totals.sumOfResultsBalance, snapshotProposal]);

  // eslint-disable-next-line max-len
  const governanceUrl = `https://snapshot.box/#/s:${linkedProposals?.snapshotIdentifier}/proposal/${linkedProposals?.proposalId}`;

  const governanceType = proposal
    ? 'cosmos'
    : snapshotProposal
      ? 'snapshot'
      : '';
  const status =
    snapshotProposal?.state || proposal?.status ? proposal?.status : '';

  const toggleShowVotesDrawer = (newModalState: boolean) => {
    setShowVotesDrawer(newModalState);
  };
  const toggleVotingModal = (newModalState: boolean) => {
    setVotingModalOpen(newModalState);
  };

  const onModalClose = () => {
    setVotingModalOpen(false);
  };

  const sidebarComponent = [
    {
      label: 'Links',
      item: (
        <div className="cards-column">
          <LinkedProposalsCard
            thread={null}
            showAddProposalButton={true}
            setLinkedProposals={setLinkedProposals}
            linkedProposals={linkedProposals}
            communityId={communityId}
          />
        </div>
      ),
    },
    ...((pollsData && pollsData?.length > 0) ||
    !app.chain?.meta?.admin_only_polling ||
    isAdmin
      ? [
          {
            label: 'Polls',
            item: (
              <div className="cards-column">
                {(pollsData || []).map((poll) => {
                  return (
                    <ThreadPollCard
                      poll={poll as unknown as ExtendedPoll}
                      key={(poll as unknown as ExtendedPoll).id}
                      actionGroups={actionGroups}
                      bypassGating={bypassGating}
                      showDeleteButton={true}
                      isCreateThreadPage={true}
                      setLocalPoll={setPollData}
                    />
                  );
                })}
                {(!app.chain?.meta?.admin_only_polling || isAdmin) && (
                  <ThreadPollEditorCard
                    threadAlreadyHasPolling={!pollsData?.length}
                    setLocalPoll={setPollData}
                    isCreateThreadPage={true}
                    threadTitle={threadTitle}
                    threadContentDelta={editorText}
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const proposalDetailSidebar = [
    ...(!isWindowSmallInclusive && (snapshotProposal || proposal)
      ? [
          {
            label: 'Detail',
            item: (
              <DetailCard
                status={status || ''}
                governanceType={governanceType}
                publishDate={snapshotProposal?.created || proposal?.createdAt}
                id={linkedProposals?.proposalId}
                Threads={threads || cosmosThreads}
                scope={communityId}
              />
            ),
          },

          {
            label: 'Timeline',
            item: (
              <TimeLineCard proposalData={snapshotProposal || proposal?.data} />
            ),
          },

          {
            label: 'Results',
            item: (
              <>
                {!snapshotLink ? (
                  <VotingResults proposal={proposal as AnyProposal} />
                ) : (
                  <VotingResultView
                    voteOptions={snapShotVotingResult}
                    showCombineBarOnly={false}
                    governanceUrl={governanceUrl}
                  />
                )}
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <CWPageLayout>
        <div className="NewThreadForm">
          <div className="form-view">
            <CWText type="h2" fontWeight="medium" className="header">
              Create thread
            </CWText>
            <div className="new-thread-body">
              <div className="new-thread-form-inputs">
                <CWTextInput
                  fullWidth
                  autoFocus
                  placeholder="Title"
                  value={threadTitle}
                  tabIndex={1}
                  onInput={(e) => setThreadTitle(e.target.value)}
                />

                {!!hasTopics && (
                  <CWSelectList
                    className="topic-select"
                    components={{
                      // eslint-disable-next-line react/no-multi-comp
                      Option: (originalProps) =>
                        CustomTopicOption({
                          originalProps,
                          topic: topicsForSelector.find(
                            (t) => String(t.id) === originalProps.data.value,
                          ),
                          helpText: weightedVotingValueToLabel(
                            topicsForSelector.find(
                              (t) => String(t.id) === originalProps.data.value,
                            )?.weighted_voting as TopicWeightedVoting,
                          ),
                        }),
                    }}
                    formatOptionLabel={(option) => (
                      <>
                        {contestTopicAffordanceVisible && (
                          <CWIcon
                            className="trophy-icon"
                            iconName="trophy"
                            iconSize="small"
                          />
                        )}
                        {option.label}
                      </>
                    )}
                    options={sortedTopics.map((topic) => ({
                      label: topic?.name,
                      value: `${topic?.id}`,
                    }))}
                    {...(!!location.search &&
                      threadTopic?.name &&
                      threadTopic?.id && {
                        value: {
                          label: threadTopic?.name,
                          value: `${threadTopic?.id}`,
                        },
                      })}
                    placeholder="Select topic"
                    customError={
                      contestTopicError
                        ? 'Can no longer post in this topic while contest is active.'
                        : ''
                    }
                    onChange={(topic) => {
                      setCanShowGatingBanner(true);
                      setThreadTopic(
                        // @ts-expect-error <StrictNullChecks/>
                        topicsForSelector.find(
                          (t) => `${t.id}` === topic?.value,
                        ),
                      );
                    }}
                  />
                )}

                {contestTopicAffordanceVisible && (
                  <ContestTopicBanner
                    contests={threadTopic?.active_contest_managers?.map(
                      (acm) => {
                        return {
                          name: acm?.name,
                          address: acm?.contest_address,
                          submittedEntries:
                            acm?.content?.filter(
                              (c) =>
                                c.actor_address === user.activeAccount?.address,
                            ).length || 0,
                        };
                      },
                    )}
                  />
                )}

                {!isDiscussion && (
                  <CWTextInput
                    placeholder="https://"
                    value={threadUrl}
                    tabIndex={2}
                    onInput={(e) => setThreadUrl(e.target.value)}
                  />
                )}

                <MarkdownEditor
                  onMarkdownEditorMethods={(methods) =>
                    (markdownEditorMethodsRef.current = methods)
                  }
                  onChange={(markdown) => setEditorText(markdown)}
                  disabled={!permissions.allowed}
                  tooltip={permissions.tooltip}
                  placeholder="Enter text or drag images and media here. Use the tab button to see your formatted post."
                  SubmitButton={() => (
                    <MarkdownSubmitButton
                      label="Create Thread"
                      disabled={
                        isDisabled ||
                        !user.activeAccount ||
                        !canUserPerformGatedAction(
                          actionGroups,
                          GatedActionEnum.CREATE_THREAD,
                          bypassGating,
                        ) ||
                        walletBalanceError ||
                        contestTopicError
                      }
                      tabIndex={4}
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onClick={handleNewThreadCreation}
                    />
                  )}
                />

                {contestThreadBannerVisible && <ContestThreadBanner />}

                <MessageRow
                  hasFeedback={!!walletBalanceError}
                  statusMessage={`Ensure that your connected wallet has at least
                ${MIN_ETH_FOR_CONTEST_THREAD} ETH to participate.`}
                  validationStatus="failure"
                />

                {showBanner && (
                  <JoinCommunityBanner
                    onClose={handleCloseBanner}
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onJoin={handleJoinCommunity}
                  />
                )}

                {canShowGatingBanner && (
                  <div>
                    <CWGatedTopicBanner
                      actions={[GatedActionEnum.CREATE_THREAD]}
                      actionGroups={actionGroups}
                      bypassGating={bypassGating}
                      onClose={() => setCanShowGatingBanner(false)}
                    />
                  </div>
                )}
              </div>
            </div>
            <>
              {isWindowSmallInclusive && (snapshotProposal || proposal) && (
                <>
                  <DetailCard
                    status={status || ''}
                    governanceType={governanceType}
                    publishDate={
                      // @ts-expect-error <StrictNullChecks/>
                      snapshotProposal?.created || proposal.createdAt
                    }
                    id={linkedProposals?.proposalId}
                    Threads={threads || cosmosThreads}
                    scope={communityId}
                  />
                  <TimeLineCard
                    proposalData={snapshotProposal || proposal?.data}
                  />
                </>
              )}
              {snapshotProposal ? (
                <>
                  <SnapshotPollCardContainer
                    activeUserAddress={activeUserAddress}
                    fetchedPower={!!power}
                    identifier={linkedProposals?.proposalId || ''}
                    proposal={snapshotProposal as SnapshotProposal}
                    scores={[]}
                    space={space as SnapshotSpace}
                    symbol={symbol}
                    totals={totals}
                    totalScore={totalScore}
                    validatedAgainstStrategies={validatedAgainstStrategies}
                    votes={votes}
                    loadVotes={async () => loadVotes()}
                    snapShotVotingResult={snapShotVotingResult}
                    toggleShowVotesDrawer={toggleShowVotesDrawer}
                  />
                  {isWindowSmallInclusive && (
                    <VotingResultView
                      voteOptions={snapShotVotingResult}
                      showCombineBarOnly={false}
                      governanceUrl={governanceUrl}
                    />
                  )}
                  <ProposalVotesDrawer
                    header="Votes"
                    votes={votes}
                    choices={snapshotProposal?.choices}
                    isOpen={showVotesDrawer}
                    setIsOpen={setShowVotesDrawer}
                  />
                </>
              ) : (
                <>
                  {proposal && (
                    <>
                      <VotingActions
                        onModalClose={onModalClose}
                        proposal={proposal}
                        toggleVotingModal={toggleVotingModal}
                        votingModalOpen={votingModalOpen}
                        redrawProposals={redrawProposals}
                        proposalRedrawState={proposalRedrawState}
                        toggleShowVotesDrawer={toggleShowVotesDrawer}
                      />
                      {isWindowSmallInclusive && (
                        <VotingResults proposal={proposal} />
                      )}
                    </>
                  )}
                </>
              )}
              {isWindowSmallInclusive && (
                <div className="action-cards">
                  {sidebarComponent?.map((view) => (
                    <div key={view?.label}>{view?.item}</div>
                  ))}
                </div>
              )}
            </>
          </div>
          {!isWindowSmallInclusive && (
            <div className="sidebar">
              <div className="actions">
                <div className="left-container">
                  <CWIcon
                    iconName="squaresFour"
                    iconSize="medium"
                    weight="bold"
                  />
                  <CWText type="h5" fontWeight="semiBold">
                    Actions
                  </CWText>
                </div>
                <CWIcon
                  iconName={isCollapsed ? 'caretDown' : 'caretUp'}
                  iconSize="small"
                  className="caret-icon"
                  weight="bold"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                />
              </div>

              {!isCollapsed &&
                sidebarComponent?.map((c) => (
                  <React.Fragment key={c?.label}>{c?.item}</React.Fragment>
                ))}
              {proposalDetailSidebar &&
                proposalDetailSidebar.map((c) => (
                  <React.Fragment key={c?.label}>{c?.item}</React.Fragment>
                ))}
            </div>
          )}
        </div>
      </CWPageLayout>
      {JoinCommunityModals}
    </>
  );
};
