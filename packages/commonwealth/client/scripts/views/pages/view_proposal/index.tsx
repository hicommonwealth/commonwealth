import React, { useState, useEffect, useRef } from 'react';

import app from 'state';
import Sublayout from 'views/Sublayout';
import { ChainBase } from 'common-common/src/types';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import {
  chainToProposalSlug,
  getProposalUrlPath,
  idToProposal,
} from 'identifiers';
import type { AnyProposal } from '../../../models/types';

import { slugify } from 'utils';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import { CWContentPage } from '../../components/component_kit/cw_content_page';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/voting_results';
import { User } from '../../components/user/user';
import { TipDetail } from '../tip_detail';
import { AaveViewProposalDetail } from './aave_summary';
import type { LinkedSubstrateProposal } from './linked_proposals_embed';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import type { SubheaderProposalType } from './proposal_components';
import { ProposalSubheader } from './proposal_components';
import { CollapsibleProposalBody } from '../../components/collapsible_body_text';
import useForceRerender from 'hooks/useForceRerender';
import { useCommonNavigate } from 'navigation/helpers';
import Cosmos from 'controllers/chain/cosmos/adapter';
import { initChain } from 'helpers/chain';

type ViewProposalPageAttrs = {
  identifier: string;
  type?: string;
};

const ViewProposalPage = ({
  identifier,
  type: typeProp,
}: ViewProposalPageAttrs) => {
  const proposalId = identifier.split('-')[0];
  const forceRender = useForceRerender();
  const navigate = useCommonNavigate();

  const [proposal, setProposal] = useState<AnyProposal>(undefined);
  const [type, setType] = useState(typeProp);
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const [isAdapterLoaded, setIsAdapterLoaded] = useState(!!app.chain?.loaded);
  const [error, setError] = useState(null);
  const hasFetchedApiRef = useRef(false);

  useEffect(() => {
    const afterAdapterLoaded = async () => {
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
    const chainInit = async () => {
      if (!hasFetchedApiRef.current) {
        hasFetchedApiRef.current = true;
        await initChain();
      }
    };

    if (!isAdapterLoaded) {
      chainInit()
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
    <Sublayout
    //  title={headerTitle}
    >
      <CWContentPage
        title={proposal.title}
        author={
          !!proposal.author && (
            <User avatarSize={24} user={proposal.author} popover linkify />
          )
        }
        createdAt={proposal.createdAt}
        updatedAt={null}
        subHeader={
          <ProposalSubheader
            proposal={proposal as SubheaderProposalType}
            toggleVotingModal={toggleVotingModal}
            votingModalOpen={votingModalOpen}
          />
        }
        body={
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
    </Sublayout>
  );
};

export default ViewProposalPage;
