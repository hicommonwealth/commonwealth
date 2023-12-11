import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { chainEntityTypeToProposalName } from 'identifiers';
import React from 'react';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import { CWText } from '../component_kit/cw_text';

interface ProposalSelectorItemProps {
  proposal: IAaveProposalResponse | ICompoundProposalResponse;
  isSelected: boolean;
  onClick: (
    proposal: IAaveProposalResponse | ICompoundProposalResponse,
  ) => void;
}

const ProposalSelectorItem = ({
  onClick,
  proposal,
  isSelected,
}: ProposalSelectorItemProps) => {
  return (
    <div className="proposal" onClick={() => onClick(proposal)}>
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div className="text">
        <CWText fontWeight="medium" truncate noWrap>
          {chainEntityTypeToProposalName() +
            (proposal.identifier.startsWith('0x')
              ? ` ${proposal.identifier.slice(0, 6)}...`
              : ` #${proposal.identifier}`)}
        </CWText>
      </div>
    </div>
  );
};

export { ProposalSelectorItem };
