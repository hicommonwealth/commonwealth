import moment from 'moment';
import React from 'react';

import { formatLastUpdated, formatTimestamp } from 'helpers';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { ProposalTag } from 'views/components/ProposalCard/ProposalTag';
import { CWCard } from 'views/components/component_kit/cw_card';
import { CWText } from 'views/components/component_kit/cw_text';

import { SnapshotProposalCardSkeleton } from './SnapshotProposalCardSkeleton';

import './SnapshotProposalCard.scss';

type SnapshotProposalCardProps = {
  snapshotId: string;
  proposal: SnapshotProposal;
  showSkeleton?: boolean;
};

export const SnapshotProposalCard = ({
  showSkeleton,
  snapshotId,
  proposal,
}: SnapshotProposalCardProps) => {
  const navigate = useCommonNavigate();

  const proposalLink = `/snapshot/${snapshotId}/${proposal.id}`;

  const time = moment(+proposal.end * 1000);
  const now = moment();

  if (showSkeleton) return <SnapshotProposalCardSkeleton />;

  // TODO: display proposal.scores and proposal.scores_total on card
  return (
    <CWCard
      elevation="elevation-2"
      interactive={true}
      className="ProposalCard"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (app.chain) {
          localStorage[`${app.activeChainId()}-proposals-scrollY`] =
            window.scrollY;
          navigate(proposalLink);
        } else {
          navigate(proposalLink);
        }
      }}
    >
      <div className="proposal-card-metadata">
        <ProposalTag
          label={`${proposal.ipfs.slice(0, 6)}...${proposal.ipfs.slice(
            proposal.ipfs.length - 6,
          )}`}
        />
        <CWText title={proposal.title} fontWeight="semiBold" noWrap>
          {proposal.title}
        </CWText>
      </div>
      <CWText>
        {now > time
          ? `Ended ${formatLastUpdated(time)}`
          : `Ending in ${formatTimestamp(moment(+proposal.end * 1000))}`}
      </CWText>
    </CWCard>
  );
};
