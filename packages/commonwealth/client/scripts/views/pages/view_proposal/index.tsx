import { ChainNetwork } from '@hicommonwealth/core';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import useForceRerender from 'hooks/useForceRerender';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import {
  chainToProposalSlug,
  getProposalUrlPath,
  idToProposal,
} from 'identifiers';
import _ from 'lodash';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { usePoolParamsQuery } from 'state/api/chainParams';
import {
  useAaveProposalsQuery,
  useCompoundProposalsQuery,
  useCosmosProposalDepositsQuery,
  useCosmosProposalMetadataQuery,
  useCosmosProposalQuery,
  useCosmosProposalTallyQuery,
  useCosmosProposalVotesQuery,
} from 'state/api/proposals';
import { slugify } from 'utils';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import type { AnyProposal } from '../../../models/types';
import { Skeleton } from '../../components/Skeleton';
import { CollapsibleProposalBody } from '../../components/collapsible_body_text';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { AaveViewProposalDetail } from './aave_summary';
import { JSONDisplay } from './json_display';
import type { SubheaderProposalType } from './proposal_components';
import { ProposalSubheader } from './proposal_components';

type ViewProposalPageAttrs = {
  identifier: string;
  type?: string;
};

const ViewProposalPage = ({
  identifier,
  type: typeProp,
}: ViewProposalPageAttrs) => {
  const proposalId = identifier.split('-')[0];
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();
  useInitChainIfNeeded(app);

  const [proposal, setProposal] = useState<AnyProposal>(undefined);
  const [title, setTitle] = useState<string>(proposal?.title);
  const [description, setDescription] = useState<string>(proposal?.description);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [isAdapterLoaded, setIsAdapterLoaded] = useState(!!app.chain?.loaded);
  const [error, setError] = useState(null);
  const { data: cosmosProposal } = useCosmosProposalQuery({
    isApiReady: !!app.chain.apiInitialized,
    proposalId,
  });
  const { data: metadata, isFetching: isFetchingMetadata } =
    useCosmosProposalMetadataQuery(proposal);
  const { data: poolData } = usePoolParamsQuery();
  useCosmosProposalVotesQuery(proposal, +poolData);
  useCosmosProposalTallyQuery(proposal);
  useCosmosProposalDepositsQuery(proposal, +poolData);

  useEffect(() => {
    setProposal(cosmosProposal);
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

  const getProposalFromStore = () => {
    let resolvedType = typeProp;
    if (!typeProp) {
      resolvedType = chainToProposalSlug(app.chain.meta);
    }
    return idToProposal(resolvedType, proposalId);
  };

  const onAave = app.chain?.network === ChainNetwork.Aave;
  const fetchAaveData = onAave && isAdapterLoaded;
  const { data: cachedAaveProposals, isLoading: aaveProposalsLoading } =
    useAaveProposalsQuery({
      moduleReady: fetchAaveData,
      communityId: app.chain?.id,
    });

  const onCompound = app.chain?.network === ChainNetwork.Compound;
  const fetchCompoundData = onCompound && isAdapterLoaded;
  const { data: cachedCompoundProposals, isLoading: compoundProposalsLoading } =
    useCompoundProposalsQuery({
      moduleReady: fetchCompoundData,
      communityId: app.chain?.id,
    });

  useEffect(() => {
    if (!aaveProposalsLoading && fetchAaveData && !proposal) {
      const foundProposal = cachedAaveProposals?.find(
        (p) => p.identifier === proposalId,
      );

      if (!foundProposal?.ipfsData) {
        foundProposal.ipfsDataReady.once('ready', () =>
          setProposal(foundProposal),
        );
      } else {
        setProposal(foundProposal);
      }
    } else if (!compoundProposalsLoading && fetchCompoundData && !proposal) {
      const foundProposal = cachedCompoundProposals?.find(
        (p) => p.identifier === proposalId,
      );
      setProposal(foundProposal);
    }
  }, [
    cachedAaveProposals,
    cachedCompoundProposals,
    isAdapterLoaded,
    aaveProposalsLoading,
    compoundProposalsLoading,
    fetchAaveData,
    fetchCompoundData,
    proposal,
    proposalId,
  ]);

  useNecessaryEffect(() => {
    const afterAdapterLoaded = async () => {
      if (onAave || onCompound) return;
      try {
        const proposalFromStore = getProposalFromStore();
        setProposal(proposalFromStore);
        setError(null);
      } catch (e) {
        console.log(`#${proposalId} Not found in store. `, e);
      }
    };

    if (!isAdapterLoaded) {
      app.chainAdapterReady.on('ready', () => {
        setIsAdapterLoaded(true);
        afterAdapterLoaded();
      });
    } else {
      afterAdapterLoaded();
    }
  }, [isAdapterLoaded, proposalId]);

  if (!isAdapterLoaded) {
    return <PageLoading message="Loading..." />;
  }

  if (error) {
    return <PageNotFound message={error} />;
  }

  const proposalTitle = title || proposal?.title;
  const proposalDescription = description || proposal?.description;

  // replace path with correct slug
  if (proposal?.slug) {
    const slugTitle = slugify(proposalTitle);
    if (identifier !== `${proposalId}-${slugTitle}`) {
      const newPath = getProposalUrlPath(
        proposal.slug,
        `${proposalId}-${slugTitle}`,
        true,
      );
      navigate(newPath, { replace: true });
    }
  }

  const toggleVotingModal = (newModalState: boolean) => {
    setVotingModalOpen(newModalState);
  };

  const onModalClose = () => {
    setVotingModalOpen(false);
  };

  return (
    <CWContentPage
      showSkeleton={!proposal}
      title={proposalTitle}
      author={proposal?.author}
      createdAt={proposal?.createdAt}
      updatedAt={null}
      subHeader={
        <ProposalSubheader
          proposal={proposal as SubheaderProposalType}
          toggleVotingModal={toggleVotingModal}
          votingModalOpen={votingModalOpen}
        />
      }
      body={() =>
        proposalDescription && (
          <CollapsibleProposalBody doc={proposalDescription} />
        )
      }
      subBody={
        <>
          {proposal instanceof AaveProposal && (
            <AaveViewProposalDetail proposal={proposal} />
          )}
          {isFetchingMetadata ? (
            <Skeleton height={94.4} />
          ) : (
            !_.isEmpty(metadata) && (
              <JSONDisplay data={metadata} title="Metadata" />
            )
          )}
          {!_.isEmpty(proposal?.data?.messages) && (
            <JSONDisplay data={proposal.data.messages} title="Messages" />
          )}
          {proposal instanceof CosmosProposal &&
            proposal?.data?.type === 'communitySpend' && (
              <JSONDisplay
                data={{
                  recipient: proposal.data?.spendRecipient,
                  amount: proposal.data?.spendAmount,
                }}
                title="Community Spend Proposal"
              />
            )}
          <VotingResults proposal={proposal} />
          <VotingActions
            onModalClose={onModalClose}
            proposal={proposal}
            toggleVotingModal={toggleVotingModal}
            votingModalOpen={votingModalOpen}
          />
        </>
      }
    />
  );
};

export default ViewProposalPage;
