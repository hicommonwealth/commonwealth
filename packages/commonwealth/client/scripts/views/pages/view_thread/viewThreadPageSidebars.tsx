import type { AnyProposal } from 'client/scripts/models/types';
import React from 'react';
import { ThreadTokenWidget } from 'views/components/NewThreadForm/ToketWidget';
import {
  type ContentPageSidebarItem,
  type SidebarComponents,
} from 'views/components/component_kit/CWContentPage';
import DetailCard from 'views/components/proposals/DetailCard';
import TimeLineCard from 'views/components/proposals/TimeLineCard';
import VotingResultView from 'views/components/proposals/VotingResultView';
import { VotingResults } from 'views/components/proposals/voting_results';
import app from '../../../state';
import { LinkedUrlCard } from './LinkedUrlCard';
import { ThreadPollCard } from './ThreadPollCard';
import { ThreadPollEditorCard } from './ThreadPollEditorCard';
import { ThreadPredictionMarketEditorCard } from './ThreadPredictionMarketEditorCard';
import { LinkedProposalsCard } from './linked_proposals_card';
import { LinkedThreadsCard } from './linked_threads_card';
import { SnapshotCreationCard } from './snapshot_creation_card';
import type { UseViewThreadDataResult } from './useViewThreadData';

export const buildViewThreadSidebarComponents = (
  data: UseViewThreadDataResult,
): SidebarComponents => {
  const sidebarItems: ContentPageSidebarItem[] = [
    ...(data.tokenizedThreadsEnabled && data.threadToken?.token_address
      ? [
          {
            label: 'Token',
            item: (
              <div className="cards-column">
                <ThreadTokenWidget
                  tokenizedThreadsEnabled={data.tokenizedThreadsEnabled}
                  threadId={data.thread?.id}
                  addressType={app.chain?.base || 'ethereum'}
                  tokenCommunity={app.chain?.meta}
                />
              </div>
            ),
          },
        ]
      : []),
    ...(data.showLinkedProposalOptions || data.showLinkedThreadOptions
      ? [
          {
            label: 'Links',
            item: (
              <div className="cards-column">
                {data.showLinkedProposalOptions && (
                  <LinkedProposalsCard
                    thread={data.thread!}
                    showAddProposalButton={data.isAuthor || data.isAdminOrMod}
                  />
                )}
                {data.showLinkedThreadOptions && (
                  <LinkedThreadsCard
                    thread={data.thread!}
                    allowLinking={data.isAuthor || data.isAdminOrMod}
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
    ...(data.isAuthor || data.isAdmin || data.hasWebLinks
      ? [
          {
            label: 'Web Links',
            item: (
              <div className="cards-column">
                <LinkedUrlCard
                  thread={data.thread!}
                  allowLinking={data.isAuthor || data.isAdminOrMod}
                />
              </div>
            ),
          },
        ]
      : []),
    ...(data.canCreateSnapshotProposal && !data.hasSnapshotProposal
      ? [
          {
            label: 'Snapshot',
            item: (
              <div className="cards-column">
                <SnapshotCreationCard
                  thread={data.thread!}
                  allowSnapshotCreation={data.isAuthor || data.isAdminOrMod}
                  onChangeHandler={data.handleSnapshotChangeWrapper}
                />
              </div>
            ),
          },
        ]
      : []),
    ...(data.pollsData.length > 0 ||
    (data.isAuthor && (!app.chain?.meta?.admin_only_polling || data.isAdmin)) ||
    (data.isAuthor && data.futarchyEnabled)
      ? [
          {
            label: 'Polls',
            item: (
              <div className="cards-column">
                {[
                  ...new Map(
                    data.pollsData.map((poll) => [poll.id, poll]),
                  ).values(),
                ].map((poll) => (
                  <ThreadPollCard
                    thread={data.thread}
                    poll={poll}
                    key={poll.id}
                    actionGroups={data.actionGroups}
                    bypassGating={data.bypassGating}
                    showDeleteButton={data.isAuthor || data.isAdmin}
                    tokenDecimals={
                      data.thread?.topic?.token_decimals ?? undefined
                    }
                    topicWeight={data.thread?.topic?.weighted_voting}
                    voterProfiles={data.voterProfiles}
                    isLoadingVotes={data.isLoadingProfiles}
                  />
                ))}
                {data.isAuthor &&
                  (!app.chain?.meta?.admin_only_polling || data.isAdmin) && (
                    <ThreadPollEditorCard
                      thread={data.thread}
                      threadAlreadyHasPolling={!data.pollsData.length}
                    />
                  )}
                {(data.isAuthor || data.isAdmin) &&
                  data.futarchyEnabled &&
                  data.thread && (
                    <ThreadPredictionMarketEditorCard
                      thread={data.thread}
                      isAuthor={data.isAuthor}
                      isAdmin={data.isAdmin}
                    />
                  )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return sidebarItems as SidebarComponents;
};

export const buildViewThreadProposalDetailSidebar = (
  data: UseViewThreadDataResult,
): SidebarComponents => {
  const proposalDetailItems: ContentPageSidebarItem[] =
    !data.isWindowSmallInclusive && (data.snapshotProposal || data.proposal)
      ? [
          {
            label: 'Detail',
            item: (
              <DetailCard
                status={data.status || ''}
                governanceType={data.governanceType || ''}
                publishDate={
                  data.snapshotProposal?.created || data.proposal?.createdAt
                }
                id={data.proposalId || data.proposalLink?.identifier}
                Threads={data.threads || data.cosmosThreads}
                scope={data.thread?.communityId}
              />
            ),
          },
          {
            label: 'Timeline',
            item: (
              <TimeLineCard
                proposalData={data.snapshotProposal || data.proposal?.data}
              />
            ),
          },
          {
            label: 'Results',
            item: data.snapshotLink ? (
              <VotingResultView
                voteOptions={data.snapShotVotingResult}
                showCombineBarOnly={false}
                governanceUrl={data.governanceUrl}
              />
            ) : (
              <VotingResults proposal={data.proposal as AnyProposal} />
            ),
          },
        ]
      : [];

  return proposalDetailItems as SidebarComponents;
};
