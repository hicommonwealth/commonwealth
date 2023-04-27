import React, { useEffect, useState } from 'react';

import { ProposalType } from 'common-common/src/types';

import 'components/proposal_card/index.scss';
import AaveProposal from 'controllers/chain/ethereum/aave/proposal';
import { SubstrateDemocracyReferendum } from 'controllers/chain/substrate/democracy_referendum';
import { SubstrateTreasuryProposal } from 'controllers/chain/substrate/treasury_proposal';
import { isNotNil } from 'helpers/typeGuards';
import { getProposalUrlPath } from 'identifiers';
import type { AnyProposal } from 'models';

import app from 'state';
import { slugify } from 'utils';
import { CWCard } from '../component_kit/cw_card';
import { CWDivider } from '../component_kit/cw_divider';
import { CWText } from '../component_kit/cw_text';
import {
  getPrimaryTagText,
  getSecondaryTagText,
  getStatusClass,
  getStatusText,
} from './helpers';
import { ProposalTag } from './proposal_tag';
import { useCommonNavigate } from 'navigation/helpers';

type ProposalCardProps = {
  injectedContent?: React.ReactNode;
  proposal: AnyProposal;
};

export const ProposalCard = (props: ProposalCardProps) => {
  const { proposal, injectedContent } = props;
  const navigate = useCommonNavigate();
  const [title, setTitle] = useState(proposal.title);

  const secondaryTagText = getSecondaryTagText(proposal);

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
          {isNotNil(secondaryTagText) && (
            <ProposalTag label={secondaryTagText} />
          )}
        </div>
        <CWText title={title} fontWeight="semiBold" noWrap>
          {title}
        </CWText>
        {proposal instanceof SubstrateTreasuryProposal && (
          <CWText className="proposal-amount-text">
            {proposal.value?.format(true)}
          </CWText>
        )}
        {proposal instanceof SubstrateDemocracyReferendum && (
          <CWText className="proposal-amount-text">{proposal.threshold}</CWText>
        )}
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
          className={`proposal-status-text ${getStatusClass(proposal)}`}
        >
          {getStatusText(proposal)}
        </CWText>
      ) : null}
      {proposal.threadId && (
        <CWText type="caption" className="proposal-thread-link-text">
          <a
            href={getProposalUrlPath(
              ProposalType.Thread,
              `${proposal.threadId}`
            )}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();

              localStorage[`${app.activeChainId()}-proposals-scrollY`] =
                window.scrollY;

              navigate(
                getProposalUrlPath(
                  ProposalType.Thread,
                  `${proposal.threadId}`,
                  true
                )
              );

              // avoid resetting scroll point
            }}
          >
            {proposal.threadTitle ? proposal.threadTitle : 'Go to thread'}
          </a>
        </CWText>
      )}
    </CWCard>
  );
};
