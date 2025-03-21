import {
  SnapshotProposal,
  SnapshotSpace,
} from 'client/scripts/helpers/snapshot_utils';
import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import useForceRerender from 'hooks/useForceRerender';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import MarkdownViewerWithFallback from '../../components/MarkdownViewerWithFallback';
import CWAccordView from '../../components/component_kit/CWAccordView/CWAccordView';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import DetailsCard from '../../components/proposals/DeatilsCard';
import TimeLine from '../../components/proposals/TimeLine';
import VotingResultView from '../../components/proposals/VotingResultView';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { PageNotFound } from '../404';
import { SnapshotPollCardContainer } from '../Snapshots/ViewSnapshotProposal/SnapshotPollCard';
import { PageLoading } from '../loading';
import { JSONDisplay } from '../view_proposal/JSONDisplay';
import ProposalVotesDrawer from './ProposalVotesDrawer/ProposalVotesDrawer';
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
  const { isWindowSmallInclusive } = useBrowserWindow({});
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [createdAt, setCreatedAt] = useState();
  const [selectedCodeEditorType, setSelectedCodeEditorType] = useState(
    CodeEditorType.Code,
  );
  const [showVotesDrawer, setShowVotesDrawer] = useState(false);

  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type');
  const querySnapshotId = searchParams.get('snapshotId');
  const proposalId =
    queryType === 'cosmos' ? identifier.split('-')[0] : identifier;
  const forceRerender = useForceRerender();
  useInitChainIfNeeded(app);
  const {
    proposal,
    title: proposalTitle,
    description,
    isLoading,
    error: cosmosError,
  } = useCosmosProposal({ proposalId });

  const {
    proposal: snapshotProposal,
    isLoading: isSnapshotLoading,
    symbol,
    votes,
    space,
    totals,
    totalScore,
    validatedAgainstStrategies,
    activeUserAddress,
    loadVotes,
    power,
  } = useSnapshotProposal({
    identifier: proposalId,
    // @ts-expect-error <StrictNullChecks/>
    snapshotId: querySnapshotId,
    enabled: queryType === 'cosmos' ? false : true,
  });
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

  if (isLoading || isSnapshotLoading) {
    return <PageLoading message="Loading..." />;
  }

  if (cosmosError) {
    return (
      <PageNotFound
        message={"We couldn't find what you searched for. Try searching again."}
      />
    );
  }

  const toggleVotingModal = (newModalState: boolean) => {
    setVotingModalOpen(newModalState);
  };

  const onModalClose = () => {
    setVotingModalOpen(false);
  };
  const toggleShowVotesDrawer = (newModalState: boolean) => {
    setShowVotesDrawer(newModalState);
  };

  const governanceUrl = `https://snapshot.box/#/s:${querySnapshotId}/proposal/${identifier}`;
  return (
    <CWPageLayout>
      {isWindowSmallInclusive && (
        <TimeLine proposalData={proposal?.data || snapshotProposal} />
      )}
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
            {isWindowSmallInclusive && (
              <DetailsCard
                status={
                  queryType === 'cosmos'
                    ? // @ts-expect-error <StrictNullChecks/>
                      proposal?.status
                    : snapshotProposal?.state
                }
                // @ts-expect-error <StrictNullChecks/>
                governanceType={queryType}
                // @ts-expect-error <StrictNullChecks/>
                publishDate={createdAt}
                id={identifier}
              />
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
              <>
                <VotingActions
                  onModalClose={onModalClose}
                  // @ts-expect-error <StrictNullChecks/>
                  proposal={proposal}
                  toggleVotingModal={toggleVotingModal}
                  votingModalOpen={votingModalOpen}
                  redrawProposals={redrawProposals}
                  proposalRedrawState={proposalRedrawState}
                  toggleShowVotesDrawer={toggleShowVotesDrawer}
                />
                {isWindowSmallInclusive && (
                  // @ts-expect-error <StrictNullChecks/>
                  <VotingResults proposal={proposal} />
                )}
              </>
            ) : (
              <>
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
                  snapShotVotingResult={snapShotVotingResult}
                  toggleShowVotesDrawer={toggleShowVotesDrawer}
                />

                {isWindowSmallInclusive && (
                  <VotingResultView
                    voteOptions={snapShotVotingResult}
                    showCombineBarOnly={false}
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
            )}
          </>
        )}
        showSidebar={isWindowSmallInclusive ? false : true}
        sidebarComponents={[
          {
            label: 'Links',
            item: (
              <DetailsCard
                status={
                  queryType === 'cosmos'
                    ? // @ts-expect-error <StrictNullChecks/>
                      proposal?.status
                    : snapshotProposal?.state
                }
                // @ts-expect-error <StrictNullChecks/>
                governanceType={queryType}
                // @ts-expect-error <StrictNullChecks/>
                publishDate={createdAt}
                id={identifier}
              />
            ),
          },
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
                  <VotingResultView
                    voteOptions={snapShotVotingResult}
                    showCombineBarOnly={false}
                    governanceUrl={governanceUrl}
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
