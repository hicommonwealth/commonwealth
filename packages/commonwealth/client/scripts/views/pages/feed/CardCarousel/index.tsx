import React, { useState, useEffect } from 'react';
import { SnapshotProposalCard } from '../../snapshot_proposals/snapshot_proposal_card';
import 'components/ProposalCard/ProposalCard.scss';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';

import './index.scss';

const sampleProposals = [
  {
    snapshotId: '1',
    proposal: {
      id: '1',
      end: Date.now() / 1000 + 1000,
      ipfs: 'QmWaNJd84hUabMmXQpLJ9fYd9KUqSH5hXx4bg2Cf1iD3Fv',
      title: 'Proposal 1',
    },
  },
  {
    snapshotId: '2',
    proposal: {
      id: '2',
      end: Date.now() / 1000 + 2000,
      ipfs: 'QmWaNJd84hUabMmXQpLJ9fYd9KUqSH5hXx4bg2Cf1iD3Fv',
      title: 'Proposal 2',
    },
  },
  {
    snapshotId: '3',
    proposal: {
      id: '3',
      end: Date.now() / 1000 + 3000,
      ipfs: 'QmWaNJd84hUabMmXQpLJ9fYd9KUqSH5hXx4bg2Cf1iD3Fv',
      title: 'Proposal 3',
    },
  },
  {
    snapshotId: '4',
    proposal: {
      id: '4',
      end: Date.now() / 1000 + 3000,
      ipfs: 'QmWaNJd84hUabMmXQpLJ9fYd9KUqSH5hXx4bg2Cf1iD3Fv',
      title: 'Proposal 3',
    },
  },
];

export const CardCarousel = () => {
  const [currentProposalsIdx, setCurrentProposalsIdx] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    setShowLeftArrow(currentProposalsIdx > 0);
    setShowRightArrow(currentProposalsIdx + 3 < sampleProposals.length);
  }, [currentProposalsIdx, sampleProposals.length]);

  const moveLeft = () => {
    setCurrentProposalsIdx(currentProposalsIdx - 3);
  };

  const moveRight = () => {
    setCurrentProposalsIdx(currentProposalsIdx + 3);
  };

  return (
    <div className="CardCarousel">
      <div className="proposal-cards-row">
        {sampleProposals
          .slice(currentProposalsIdx, currentProposalsIdx + 3)
          .map((proposalData, index) => (
            <SnapshotProposalCard
              key={index}
              snapshotId={proposalData.snapshotId}
              proposal={proposalData.proposal}
            />
          ))}
      </div>
      {showLeftArrow && (
        <button className="arrow left-arrow" onClick={moveLeft}>
          <CWIcon iconName="arrowLeft" iconSize="small" />
        </button>
      )}
      {showRightArrow && (
        <button className="arrow right-arrow" onClick={moveRight}>
          <CWIcon iconName="arrowRight" iconSize="small" />
        </button>
      )}
    </div>
  );
};
