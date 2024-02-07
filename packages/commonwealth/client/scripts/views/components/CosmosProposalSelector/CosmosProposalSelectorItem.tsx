import React from 'react';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import { CosmosProposal } from 'controllers/chain/cosmos/gov/v1beta1/proposal-v1beta1';
import { CWText } from '../component_kit/cw_text';

interface CosmosProposalSelectorItemProps {
  proposal: CosmosProposal;
  isSelected: boolean;
  onClick: (proposal: CosmosProposal) => void;
}

const CosmosProposalSelectorItem = ({
  onClick,
  proposal,
  isSelected,
}: CosmosProposalSelectorItemProps) => {
  return (
    <div className="proposal" onClick={() => onClick(proposal)}>
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div className="text">
        <CWText fontWeight="medium" truncate noWrap>
          #{proposal.identifier} {proposal.title}
        </CWText>
        <CWText type="caption" truncate>
          {proposal.status.toString() !== 'undefined'
            ? proposal.status
                .toString()
                .replace(/([A-Z])/g, ' $1')
                .trim()
            : 'No thread title'}
        </CWText>
      </div>
    </div>
  );
};

export { CosmosProposalSelectorItem };
