import {
  SnapshotProposal,
  SnapshotSpace,
} from 'client/scripts/helpers/snapshot_utils';
import { CWIcon } from 'client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import DetailCard from 'client/scripts/views/components/proposals/DetailCard';
import TimeLineCard from 'client/scripts/views/components/proposals/TimeLineCard';
import VotingResultView from 'client/scripts/views/components/proposals/VotingResultView';
import { VotingActions } from 'client/scripts/views/components/proposals/voting_actions';
import { VotingResults } from 'client/scripts/views/components/proposals/voting_results';
import React from 'react';
import type { SidebarComponents } from '../../components/component_kit/CWContentPage';
import ProposalVotesDrawer from '../NewProposalViewPage/ProposalVotesDrawer/ProposalVotesDrawer';
import { SnapshotPollCardContainer } from '../Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import type { UseViewThreadDataResult } from './useViewThreadData';

type ViewThreadPageSubBodyProps = {
  data: UseViewThreadDataResult;
  sidebarComponents: SidebarComponents;
};

export const ViewThreadPageSubBody = ({
  data,
  sidebarComponents,
}: ViewThreadPageSubBodyProps) => {
  return (
    <>
      {data.isWindowSmallInclusive &&
        (data.snapshotProposal || data.proposal) && (
          <>
            <DetailCard
              status={data.status || ''}
              governanceType={data.governanceType || ''}
              publishDate={
                // @ts-expect-error <StrictNullChecks/>
                data.snapshotProposal?.created || data.proposal.createdAt
              }
              id={data.proposalId || data.proposalLink?.identifier}
              Threads={data.threads || data.cosmosThreads}
              scope={data.thread?.communityId}
            />
            <TimeLineCard
              proposalData={data.snapshotProposal || data.proposal?.data}
            />
          </>
        )}
      {data.snapshotProposal ? (
        <>
          <SnapshotPollCardContainer
            activeUserAddress={data.activeUserAddress}
            fetchedPower={!!data.power}
            identifier={data.proposalId}
            proposal={data.snapshotProposal as SnapshotProposal}
            scores={[]}
            space={data.space as SnapshotSpace}
            symbol={data.symbol}
            totals={data.totals}
            totalScore={data.totalScore}
            validatedAgainstStrategies={data.validatedAgainstStrategies}
            votes={data.votes}
            loadVotes={async () => data.loadVotes()}
            snapShotVotingResult={data.snapShotVotingResult}
            toggleShowVotesDrawer={data.toggleShowVotesDrawer}
          />
          {data.isWindowSmallInclusive && (
            <VotingResultView
              voteOptions={data.snapShotVotingResult}
              showCombineBarOnly={false}
              governanceUrl={data.governanceUrl}
            />
          )}
          <ProposalVotesDrawer
            header="Votes"
            votes={data.votes}
            choices={data.snapshotProposal?.choices}
            isOpen={data.showVotesDrawer}
            setIsOpen={data.setShowVotesDrawer}
          />
        </>
      ) : (
        <>
          {data.proposal && (
            <>
              <VotingActions
                onModalClose={data.onModalClose}
                proposal={data.proposal}
                toggleVotingModal={data.toggleVotingModal}
                votingModalOpen={data.votingModalOpen}
                redrawProposals={data.redrawProposals}
                proposalRedrawState={data.proposalRedrawState}
                toggleShowVotesDrawer={data.toggleShowVotesDrawer}
              />
              {data.isWindowSmallInclusive && (
                <VotingResults proposal={data.proposal} />
              )}
            </>
          )}
        </>
      )}
      {data.isWindowSmallInclusive && (
        <div className="mobile-action-card-container ">
          <div className="actions">
            <div className="left-container">
              <CWIcon iconName="squaresFour" iconSize="medium" weight="bold" />
              <CWText type="h5" fontWeight="semiBold">
                Actions
              </CWText>
            </div>
            <CWIcon
              iconName={data.isCollapsed ? 'caretDown' : 'caretUp'}
              iconSize="small"
              className="caret-icon"
              weight="bold"
              onClick={() => data.setIsCollapsed(!data.isCollapsed)}
            />
          </div>

          <div className="action-cards">
            {!data.isCollapsed &&
              sidebarComponents.flatMap((view) =>
                view ? [<div key={view.label}>{view.item}</div>] : [],
              )}
          </div>
        </div>
      )}
    </>
  );
};
