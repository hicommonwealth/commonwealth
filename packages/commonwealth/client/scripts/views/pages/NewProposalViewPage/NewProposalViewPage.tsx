import {
  SnapshotProposal,
  SnapshotSpace,
} from 'client/scripts/helpers/snapshot_utils';
import useForceRerender from 'hooks/useForceRerender';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import _ from 'lodash';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageLoading } from 'views/pages/loading';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import MarkdownViewerWithFallback from '../../components/MarkdownViewerWithFallback';
import { Skeleton } from '../../components/Skeleton';
import CWAccordView from '../../components/component_kit/CWAccordView/CWAccordView';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import DetailsCard from '../../components/proposals/DeatilsCard';
import TimeLine from '../../components/proposals/TimeLine';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { PageNotFound } from '../404';
import { SnapshotPollCardContainer } from '../Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import { JSONDisplay } from '../view_proposal/JSONDisplay';
import { useCosmosProposal } from './useCosmosProposal';
import { useSnapshotProposal } from './useSnapshotProposal';
type ViewProposalPageAttrs = {
  identifier: string;
  type?: string;
};
const NewProposalViewPage = ({ identifier }: ViewProposalPageAttrs) => {
  const proposalId = identifier.split('-')[0];
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();
  useInitChainIfNeeded(app);

  const snapshotId = 'aave.eth';

  const snapshotProposalId =
    '0x713989ad71340840fa1f52d6b19c00f001a967070c7a506696034f68774a1986';
  const {
    proposal,
    title: proposalTitle,
    description: proposalDescription,
    isLoading,
    isFetchingMetadata,
    error: cosmosError,
    metadata,
  } = useCosmosProposal({ proposalId });
  // Snapshot

  // Snapshot proposal data
  const {
    proposal: snapshotProposal,
    isLoading: isSnapshotLoading,
    threads,
    symbol,
    votes,
    space,
    totals,
    totalScore,
    validatedAgainstStrategies,
    proposalAuthor,
    activeUserAddress,
    loadVotes,
    power,
  } = useSnapshotProposal({
    identifier: snapshotProposalId,
    snapshotId: snapshotId,
  });

  console.log('Snaphot data', {
    snapshotProposal,
    isSnapshotLoading,
    threads,
    votes,
    space,
    totals,
    validatedAgainstStrategies,
    proposalAuthor,
    activeUserAddress,
    totalScore,
  });
  //COSMO
  const [proposalRedrawState, redrawProposals] = useState<boolean>(true);
  const [votingModalOpen, setVotingModalOpen] = useState(false);

  useEffect(() => {
    proposal?.isFetched?.once('redraw', forceRerender);

    return () => {
      proposal?.isFetched?.removeAllListeners();
    };
  }, [proposal, forceRerender]);

  useManageDocumentTitle('View proposal', proposalTitle);

  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  if (cosmosError) {
    return (
      <PageNotFound
        message={"We couldn't find what you searched for. Try searching again."}
      />
    );
  }

  // replace path with correct slug
  //   if (proposal?.slug) {
  //     const slugTitle = slugify(proposalTitle);
  //     if (identifier !== `${proposalId}-${slugTitle}`) {
  //       const newPath = getProposalUrlPath(
  //         proposal.slug,
  //         `${proposalId}-${slugTitle}`,
  //         true,
  //       );
  //       navigate(newPath, { replace: true });
  //     }
  //   }

  const toggleVotingModal = (newModalState: boolean) => {
    setVotingModalOpen(newModalState);
  };

  const onModalClose = () => {
    setVotingModalOpen(false);
  };
  return (
    <CWPageLayout>
      <CWContentPage
        showSkeleton={!proposal}
        title={proposalTitle}
        author={proposal?.author}
        createdAt={proposal?.createdAt}
        // @ts-expect-error <StrictNullChecks/>
        updatedAt={null}
        body={() => (
          <>
            {isFetchingMetadata ? (
              <Skeleton height={94.4} />
            ) : (
              !_.isEmpty(metadata) && (
                <JSONDisplay data={metadata} title="Metadata" />
              )
            )}
            <CWAccordView title="Description" defaultOpen={false}>
              <MarkdownViewerWithFallback markdown={proposalDescription} />
            </CWAccordView>

            <CWAccordView title="SnapShot descrption" defaultOpen={false}>
              <MarkdownViewerWithFallback markdown={snapshotProposal?.body} />
            </CWAccordView>
            <VotingActions
              onModalClose={onModalClose}
              // @ts-expect-error <StrictNullChecks/>
              proposal={proposal}
              toggleVotingModal={toggleVotingModal}
              votingModalOpen={votingModalOpen}
              redrawProposals={redrawProposals}
              proposalRedrawState={proposalRedrawState}
            />
            <SnapshotPollCardContainer
              activeUserAddress={activeUserAddress}
              fetchedPower={!!power}
              identifier={identifier}
              proposal={snapshotProposal as SnapshotProposal}
              scores={[]} // unused?
              space={space as SnapshotSpace}
              symbol={symbol}
              totals={totals}
              totalScore={totalScore}
              validatedAgainstStrategies={validatedAgainstStrategies}
              votes={votes}
              loadVotes={async () => loadVotes()}
            />
          </>
        )}
        showSidebar={true}
        sidebarComponents={[
          { label: 'Links', item: <DetailsCard /> },
          { label: 'Links', item: <TimeLine proposalData={proposal?.data} /> },
          // @ts-expect-error <StrictNullChecks/>
          { label: 'Results', item: <VotingResults proposal={proposal} /> },
        ]}
      />
    </CWPageLayout>
  );
};

export default NewProposalViewPage;
