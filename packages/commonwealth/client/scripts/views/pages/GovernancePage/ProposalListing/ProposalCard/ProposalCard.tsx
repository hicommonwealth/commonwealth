import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import { CWThreadAction } from 'client/scripts/views/components/component_kit/new_designs/cw_thread_action';
import { CWTag } from 'client/scripts/views/components/component_kit/new_designs/CWTag';
import React from 'react';
import { smartTrim } from 'shared/utils';
import './ProposalCard.scss';

interface ProposalCardProps {
  status: string;
  title?: string;
}

const ProposalCard = ({ status, title = 'Proposal' }: ProposalCardProps) => {
  return (
    <div className="ProposalCard">
      <div className="content">
        <div className="header">
          <CWTag label={status} type="proposal" />
        </div>
        <CWText fontWeight="semiBold">{smartTrim(title, 25)}</CWText>
        <div className="progress-bar"></div>
        <div className="quorm">
          <CWText fontWeight="regular" type="caption">
            No quorum requirment linked
          </CWText>
        </div>
      </div>
      <div className="comments">
        <CWThreadAction label="Comments" action="comment" />
      </div>
    </div>
  );
};

export default ProposalCard;
