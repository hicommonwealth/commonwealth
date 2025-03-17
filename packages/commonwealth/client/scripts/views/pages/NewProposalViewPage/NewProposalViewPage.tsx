import {
  SnapshotProposal,
  SnapshotSpace,
} from 'client/scripts/helpers/snapshot_utils';
import useForceRerender from 'hooks/useForceRerender';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import _ from 'lodash';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import MarkdownViewerWithFallback from '../../components/MarkdownViewerWithFallback';
import { Skeleton } from '../../components/Skeleton';
import CWAccordView from '../../components/component_kit/CWAccordView/CWAccordView';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import DetailsCard from '../../components/proposals/DeatilsCard';
import GoveranceVote from '../../components/proposals/GoveranceVote';
import TimeLine from '../../components/proposals/TimeLine';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { PageNotFound } from '../404';
import { SnapshotPollCardContainer } from '../Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import { JSONDisplay } from '../view_proposal/JSONDisplay';
import { useCosmosProposal } from './useCosmosProposal';
import { useSnapshotProposal } from './useSnapshotProposal';
type ViewProposalPageAttrs = {
  id: string;
  identifier: string;
  type?: string;
};
export enum CodeEditorType {
  Code,
  Preview,
}
const NewProposalViewPage = ({ identifier }: ViewProposalPageAttrs) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [createdAt, setCreatedAt] = useState();
  const [selectedCodeEditorType, setSelectedCodeEditorType] = useState(
    CodeEditorType.Code,
  );

  const { scope } = useParams<{
    scope: string;
  }>();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type');
  const querySnapshotId = searchParams.get('snapshotId');
  const proposalId =
    queryType === 'cosmos' ? identifier.split('-')[0] : identifier;
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();
  useInitChainIfNeeded(app);
  const {
    proposal,
    title: proposalTitle,
    description,
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
    identifier: proposalId,
    // @ts-expect-error <StrictNullChecks/>
    snapshotId: querySnapshotId,
  });

  const snapShotVoitingResult = React.useMemo(() => {
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
  useEffect(() => {
    if (proposal || snapshotProposal) {
      if (queryType === 'cosmos') {
        // @ts-expect-error <StrictNullChecks/>
        setTitle(proposal?.title);
        // @ts-expect-error <StrictNullChecks/>
        setAuthor(proposal?.author);
        // @ts-expect-error <StrictNullChecks/>
        setCreatedAt(proposal?.createdAt);
      } else {
        // @ts-expect-error <StrictNullChecks/>
        setTitle(snapshotProposal?.title);
        // @ts-expect-error <StrictNullChecks/>
        setAuthor(snapshotProposal?.author);
        // @ts-expect-error <StrictNullChecks/>
        setCreatedAt(snapshotProposal?.created);
      }
    }
  }, [snapshotProposal, proposal, queryType]);

  //   if (isLoading || isSnapshotLoading) {
  //     return <PageLoading message="Loading..." />;
  //   }

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
        showSkeleton={!proposal && !snapshotProposal}
        title={title}
        // @ts-expect-error <StrictNullChecks/>
        author={author}
        createdAt={createdAt}
        // @ts-expect-error <StrictNullChecks/>
        updatedAt={null}
        body={() => (
          <>
            {isFetchingMetadata ? (
              <Skeleton height={94.4} />
            ) : (
              !_.isEmpty(metadata) && <JSONDisplay data={metadata} />
            )}
            {(description || snapshotProposal?.body) && (
              <CWAccordView title="Description" defaultOpen={true}>
                <MarkdownViewerWithFallback
                  markdown={description || snapshotProposal?.body}
                />
              </CWAccordView>
            )}
            {queryType === 'cosmos' && (
              <CWAccordView title="Code" defaultOpen={false}>
                <CWTabsRow>
                  <CWTab
                    label="Code"
                    onClick={() =>
                      setSelectedCodeEditorType(CodeEditorType.Code)
                    }
                    isSelected={true}
                  />
                  <CWTab
                    label="Preview"
                    isSelected={false}
                    onClick={() => {
                      setSelectedCodeEditorType(CodeEditorType.Preview);
                    }}
                    isDisabled
                  />
                </CWTabsRow>
                {selectedCodeEditorType === CodeEditorType.Code && (
                  <div>
                    <JSONDisplay data={proposal?.data?.messages} />
                  </div>
                )}
              </CWAccordView>
            )}
            {queryType === 'cosmos' ? (
              <VotingActions
                onModalClose={onModalClose}
                // @ts-expect-error <StrictNullChecks/>
                proposal={proposal}
                toggleVotingModal={toggleVotingModal}
                votingModalOpen={votingModalOpen}
                redrawProposals={redrawProposals}
                proposalRedrawState={proposalRedrawState}
              />
            ) : (
              <SnapshotPollCardContainer
                activeUserAddress={activeUserAddress}
                fetchedPower={!!power}
                identifier={proposalId}
                proposal={snapshotProposal as SnapshotProposal}
                scores={[]}
                space={space as SnapshotSpace}
                symbol={symbol}
                totals={totals}
                totalScore={totalScore}
                validatedAgainstStrategies={validatedAgainstStrategies}
                votes={votes}
                loadVotes={async () => loadVotes()}
              />
            )}
          </>
        )}
        showSidebar={true}
        sidebarComponents={[
          { label: 'Links', item: <DetailsCard /> },
          {
            label: 'Timeline',
            item: (
              <TimeLine proposalData={proposal?.data || snapshotProposal} />
            ),
          },
          {
            label: 'Results',
            item: (
              <>
                {queryType === 'cosmos' ? (
                  // @ts-expect-error <StrictNullChecks/>
                  <VotingResults proposal={proposal} />
                ) : (
                  <GoveranceVote
                    voteOptions={snapShotVoitingResult}
                    quorum={60}
                    governanceType="Cosmos Proposal"
                    barColor="#3366cc"
                  />
                )}
              </>
            ),
          },
        ]}
      />
    </CWPageLayout>
  );
};

export default NewProposalViewPage;
