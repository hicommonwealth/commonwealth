import React, { useEffect, useState } from 'react';

import 'components/ProposalCard/ProposalCard.scss';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { isNotNil } from 'helpers/typeGuards';
import { getProposalUrlPath } from 'identifiers';
import type { AnyProposal } from '../../../models/types';

import app from 'state';
import { slugify } from 'utils';
import { CWCard } from '../component_kit/cw_card';
import { CWDivider } from '../component_kit/cw_divider';
import { CWText } from '../component_kit/cw_text';
import { getPrimaryTagText, getStatusClass, getStatusText } from './helpers';
import { ProposalTag } from './ProposalTag';
import { useCommonNavigate } from 'navigation/helpers';
import {
  useCosmosProposalTallyQuery,
  useCosmosProposalMetadataQuery,
} from 'state/api/proposals';

type ProposalCardProps = {
  injectedContent?: React.ReactNode;
  proposal: AnyProposal;
};

export const ProposalCard = ({
  proposal,
  injectedContent,
}: ProposalCardProps) => {
  const navigate = useCommonNavigate();
  const [title, setTitle] = useState(
    proposal.title || `Proposal ${proposal.identifier}`
  );
  const { data: metadata } = useCosmosProposalMetadataQuery(proposal);
  const { isFetching: isFetchingTally } = useCosmosProposalTallyQuery(proposal);

  useEffect(() => {
    if (metadata?.title) setTitle(metadata?.title);
  }, [metadata]);

  useEffect(() => {
    if (proposal instanceof AaveProposal) {
      proposal.ipfsDataReady.once('ready', () => {
        // triggers render of shortDescription too
        setTitle(proposal?.ipfsData.title);
      });
    }
  }, [proposal]);

  useEffect(() => {
    if (proposal instanceof AaveProposal) {
      proposal.ipfsDataReady.once('ready', () => {
        // triggers render of shortDescription too
        setTitle(proposal?.ipfsData.title);
      });
    }
  }, [proposal]);

  return (
    <CWCard
      elevation="elevation-2"
      interactive
      className="ProposalCard"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();

        localStorage[`${app.activeChainId()}-proposals-scrollY`] =
          window.scrollY;

        const path = getProposalUrlPath(
          proposal.slug,
          `${proposal.identifier}-${slugify(proposal.title)}`,
          true
        );

        navigate(path); // avoid resetting scroll point
      }}
    >
      <div className="proposal-card-metadata">
        <div className="tag-row">
          <ProposalTag label={getPrimaryTagText(proposal)} />
        </div>
        <CWText title={title} fontWeight="semiBold" noWrap>
          {title}
        </CWText>
        {proposal instanceof AaveProposal &&
          proposal.ipfsData?.shortDescription && (
            <CWText type="caption">
              {proposal.ipfsData?.shortDescription}
            </CWText>
          )}
      </div>
      {injectedContent ? (
        <>
          <CWDivider />
          <div className="proposal-injected">{injectedContent}</div>
        </>
      ) : proposal.isPassing !== 'none' ? (
        <CWText
          fontWeight="medium"
          className={`proposal-status-text ${getStatusClass(
            proposal,
            isFetchingTally
          )}`}
        >
          {getStatusText(proposal, isFetchingTally)}
        </CWText>
      ) : null}
    </CWCard>
  );
};
