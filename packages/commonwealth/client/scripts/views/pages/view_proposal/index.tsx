import React, { useState, useEffect, useRef } from 'react';
import { ChainBase, ChainNetwork } from 'common-common/src/types';
import Cosmos from 'controllers/chain/cosmos/adapter';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { useInitChainIfNeeded } from 'hooks/useInitChainIfNeeded';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import useForceRerender from 'hooks/useForceRerender';
import { useProposalMetadata } from 'hooks/cosmos/useProposalMetadata';
import {
  chainToProposalSlug,
  getProposalUrlPath,
  idToProposal,
} from 'identifiers';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { slugify } from 'utils';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import type { AnyProposal } from '../../../models/types';
import { CollapsibleProposalBody } from '../../components/collapsible_body_text';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { TipDetail } from '../tip_detail';
import { AaveViewProposalDetail } from './aave_summary';
import type { LinkedSubstrateProposal } from './linked_proposals_embed';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import type { SubheaderProposalType } from './proposal_components';
import { ProposalSubheader } from './proposal_components';
import { JSONDisplay } from './json_display';
import useAaveProposalsQuery from 'state/api/proposals/aave/fetchAaveProposals';

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

  const hasFetchedProposalRef = useRef(false);
  const [proposal, setProposal] = useState<AnyProposal>(undefined);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [isAdapterLoaded, setIsAdapterLoaded] = useState(!!app.chain?.loaded);
  const [error, setError] = useState(null);
  const { metadata } = useProposalMetadata({ app, proposal });

  useEffect(() => {
    if (metadata?.title) forceRerender();
  }, [metadata?.title, forceRerender]);

  useEffect(() => {
    proposal?.isFetched.once('redraw', forceRerender);

    return () => {
      proposal?.isFetched.removeAllListeners();
    };
  }, [proposal, forceRerender]);

  const onAave = app.chain?.network === ChainNetwork.Aave;
  const fetchAaveData = onAave && isAdapterLoaded;
  const { data: cachedAaveProposals, isLoading: aaveProposalsLoading } =
    useAaveProposalsQuery({
      moduleReady: fetchAaveData,
      chainId: app.chain?.id,
    });

  if (aaveProposalsLoading === false && fetchAaveData && !proposal) {
    const foundProposal = cachedAaveProposals?.find(
      (p) => p.identifier === proposalId
    );

    if (!foundProposal?.ipfsData) {
      foundProposal.ipfsDataReady.on('ready', () => {
        setProposal(foundProposal);
      });
    } else {
      setProposal(foundProposal);
    }
  }

  useNecessaryEffect(() => {
    const afterAdapterLoaded = async () => {
      if (onAave) return;

      if (hasFetchedProposalRef.current) return;
      hasFetchedProposalRef.current = true;

      let resolvedType = typeProp;
      if (!typeProp) {
        resolvedType = chainToProposalSlug(app.chain.meta);
      }

      try {
        const proposalFromStore = idToProposal(resolvedType, proposalId);
        setProposal(proposalFromStore);
        setError(null);
      } catch (e) {
        // special case handling for completed cosmos proposals
        if (app.chain.base === ChainBase.CosmosSDK) {
          try {
            const cosmosProposal = await (
              app.chain as Cosmos
            ).governance.getProposal(+proposalId);
            setProposal(cosmosProposal);
            setError(null);
          } catch (err) {
            setError('Proposal not found');
          }
        } else {
          setError('Proposal not found');
        }
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

  if (!isAdapterLoaded || !proposal) {
    return <PageLoading message="Loading..." />;
  }

  if (error) {
    return <PageNotFound message={error} />;
  }

  // replace path with correct slug
  if (identifier !== `${proposalId}-${slugify(proposal.title)}`) {
    const newPath = getProposalUrlPath(
      proposal.slug,
      `${proposalId}-${slugify(proposal.title)}`,
      true
    );
    navigate(newPath, { replace: true });
  }

  // special case loading for tips
  if (proposal instanceof SubstrateTreasuryTip) {
    return <TipDetail proposal={proposal} />;
  }

  const toggleVotingModal = (newModalState: boolean) => {
    setVotingModalOpen(newModalState);
  };

  const onModalClose = () => {
    setVotingModalOpen(false);
  };

  return (
    <CWContentPage
      title={proposal.title}
      author={proposal.author}
      createdAt={proposal.createdAt}
      updatedAt={null}
      subHeader={
        <ProposalSubheader
          proposal={proposal as SubheaderProposalType}
          toggleVotingModal={toggleVotingModal}
          votingModalOpen={votingModalOpen}
        />
      }
      body={() =>
        !!proposal.description && (
          <CollapsibleProposalBody proposal={proposal} />
        )
      }
      subBody={
        <>
          <LinkedProposalsEmbed
            proposal={proposal as LinkedSubstrateProposal}
          />
          {proposal instanceof AaveProposal && (
            <AaveViewProposalDetail proposal={proposal} />
          )}
          {metadata && <JSONDisplay data={metadata} title="Metadata" />}
          {proposal.data?.messages && (
            <JSONDisplay data={proposal.data.messages} title="Messages" />
          )}
          {proposal instanceof CosmosProposal &&
            proposal.data.type === 'communitySpend' && (
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
