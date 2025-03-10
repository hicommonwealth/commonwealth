import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import React from 'react';
import './GovernanceProposalCard.scss';

const GovernanceProposalCard = () => {
  return (
    <div className="GovernanceProposalCard">
      <div className="card-header">
        <CWText fontWeight="medium" type="h5">
          Proposals
        </CWText>
      </div>

      <CWText fontWeight="semiBold" type="h1">
        9
      </CWText>
      <CWText fontWeight="regular" type="buttonSm">
        There are active proposals
      </CWText>
    </div>
  );
};

export default GovernanceProposalCard;
