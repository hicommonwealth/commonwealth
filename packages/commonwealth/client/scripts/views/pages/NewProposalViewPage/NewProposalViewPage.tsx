import useForceRerender from 'hooks/useForceRerender';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import _ from 'lodash';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { usePoolParamsQuery } from 'state/api/chainParams';
import {
  useCosmosProposalDepositsQuery,
  useCosmosProposalMetadataQuery,
  useCosmosProposalQuery,
  useCosmosProposalTallyQuery,
  useCosmosProposalVotesQuery,
} from 'state/api/proposals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageLoading } from 'views/pages/loading';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import type { AnyProposal } from '../../../models/types';
import MarkdownViewerWithFallback from '../../components/MarkdownViewerWithFallback';
import { Skeleton } from '../../components/Skeleton';
import CWAccordView from '../../components/component_kit/CWAccordView/CWAccordView';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import DetailsCard from '../../components/proposals/DeatilsCard';
import TimeLine from '../../components/proposals/TimeLine';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { PageNotFound } from '../404';
import { JSONDisplay } from '../view_proposal/JSONDisplay';
type ViewProposalPageAttrs = {
  identifier: string;
  type?: string;
};
const NewProposalViewPage = ({ identifier }: ViewProposalPageAttrs) => {
  const proposalId = identifier.split('-')[0];
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();
  useInitChainIfNeeded(app);

  // @ts-expect-error <StrictNullChecks/>
  const [proposal, setProposal] = useState<AnyProposal>(undefined);
  const [proposalRedrawState, redrawProposals] = useState<boolean>(true);
  const [title, setTitle] = useState<string>(proposal?.title);
  const [description, setDescription] = useState<string>(proposal?.description);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [isAdapterLoaded, setIsAdapterLoaded] = useState(!!app.chain?.loaded);
  const {
    data: cosmosProposal,
    error: cosmosError,
    isFetching: isFetchingProposal,
  } = useCosmosProposalQuery({
    isApiReady: !!app.chain.apiInitialized,
    proposalId,
  });
  const { data: metadata, isFetching: isFetchingMetadata } =
    useCosmosProposalMetadataQuery(proposal);
  const { data: poolData } = usePoolParamsQuery();
  // @ts-expect-error <StrictNullChecks/>
  useCosmosProposalVotesQuery(proposal, +poolData);
  useCosmosProposalTallyQuery(proposal);
  // @ts-expect-error <StrictNullChecks/>
  useCosmosProposalDepositsQuery(proposal, +poolData);

  useEffect(() => {
    // @ts-expect-error <StrictNullChecks/>
    setProposal(cosmosProposal);
    // @ts-expect-error <StrictNullChecks/>
    setTitle(cosmosProposal?.title);
    setDescription(cosmosProposal?.description);
  }, [cosmosProposal]);

  useEffect(() => {
    if (_.isEmpty(metadata)) return;
    setTitle(metadata?.title);
    setDescription(metadata?.description || metadata?.summary);
  }, [metadata]);

  useEffect(() => {
    proposal?.isFetched.once('redraw', forceRerender);

    return () => {
      proposal?.isFetched.removeAllListeners();
    };
  }, [proposal, forceRerender]);

  useManageDocumentTitle('View proposal', proposal?.title);

  useNecessaryEffect(() => {
    if (!isAdapterLoaded) {
      app.chainAdapterReady.on('ready', () => {
        setIsAdapterLoaded(true);
      });
    }
  }, [isAdapterLoaded, proposalId]);

  if (isFetchingProposal || !isAdapterLoaded) {
    return <PageLoading message="Loading..." />;
  }

  if (cosmosError) {
    return (
      <PageNotFound
        message={"We couldn't find what you searched for. Try searching again."}
      />
    );
  }

  const proposalTitle = title || proposal?.title;
  const proposalDescription = description || proposal?.description;

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
  console.log('cosmo', proposal?.author);
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

            <VotingActions
              onModalClose={onModalClose}
              proposal={proposal}
              toggleVotingModal={toggleVotingModal}
              votingModalOpen={votingModalOpen}
              redrawProposals={redrawProposals}
              proposalRedrawState={proposalRedrawState}
            />
          </>
        )}
        showSidebar={true}
        sidebarComponents={[
          { label: 'Links', item: <DetailsCard /> },
          { label: 'Links', item: <TimeLine proposalData={proposal?.data} /> },
          { label: 'Results', item: <VotingResults proposal={proposal} /> },
        ]}
      />
    </CWPageLayout>
  );
};

export default NewProposalViewPage;
