import React, { useState, useEffect, useRef } from 'react';
import { ChainBase } from 'common-common/src/types';
import Cosmos from 'controllers/chain/cosmos/adapter';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
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
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';

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
  const [type, setType] = useState(typeProp);
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

  useNecessaryEffect(() => {
    const afterAdapterLoaded = async () => {
      if (hasFetchedProposalRef.current) return;
      hasFetchedProposalRef.current = true;

      if (!type) {
        setType(chainToProposalSlug(app.chain.meta));
      }

      try {
        const proposalFromStore = idToProposal(type, proposalId);
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
  }, [type, isAdapterLoaded, proposalId]);

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
