import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { SubstrateTreasuryTip } from 'controllers/chain/substrate/treasury_tip';
import { getProposalUrlPath } from 'identifiers';
import _ from 'lodash';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import { slugify } from 'utils';
import { PageNotFound } from 'views/pages/404';
import { PageLoading } from 'views/pages/loading';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import { CollapsibleProposalBody } from '../../components/collapsible_body_text';
import { CWContentPage } from '../../components/component_kit/CWContentPage';
import { VotingActions } from '../../components/proposals/voting_actions';
import { VotingResults } from '../../components/proposals/VotingResults';
import { Skeleton } from '../../components/Skeleton';
import { TipDetail } from '../tip_detail';
import { AaveViewProposalDetail } from './aave_summary';
import { JSONDisplay } from './json_display';
import type { LinkedSubstrateProposal } from './linked_proposals_embed';
import { LinkedProposalsEmbed } from './linked_proposals_embed';
import type { SubheaderProposalType } from './proposal_components';
import { ProposalSubheader } from './proposal_components';
import { useProposalData } from './useProposalData';

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
  const [votingModalOpen, setVotingModalOpen] = useState(false);
  const {
    error,
    metadata,
    isAdapterLoaded,
    proposal,
    title,
    description,
    isFetchingMetadata,
  } = useProposalData(proposalId, typeProp);

  useManageDocumentTitle('View proposal', proposal?.title);

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
        true
      );
      navigate(newPath, { replace: true });
    }
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
          <LinkedProposalsEmbed
            proposal={proposal as LinkedSubstrateProposal}
          />
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
          <VotingResults proposal={proposal} isInCard={false} />
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
