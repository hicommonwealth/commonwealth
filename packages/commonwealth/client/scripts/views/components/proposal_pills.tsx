import React from 'react';

import './proposal_pills.scss';

import { formatTimestamp } from 'helpers';
import moment from 'moment';
import { CWText } from './component_kit/cw_text';

type ActiveProposalPillProps = { proposalEnd: number };

export const ActiveProposalPill = (props: ActiveProposalPillProps) => {
  const { proposalEnd } = props;

  return (
    <div className="ActiveProposalPill">
      <CWText type="caption">
        Ends in {formatTimestamp(moment(+proposalEnd * 1000))}
      </CWText>
      <CWText type="caption" fontWeight="medium" className="active-text">
        Active
      </CWText>
    </div>
  );
};

type ClosedProposalPillProps = { proposalState: string };

export const ClosedProposalPill = (props: ClosedProposalPillProps) => {
  const { proposalState } = props;

  return (
    <div className="ClosedProposalPill">
      <CWText type="caption" fontWeight="semiBold" className="closed-text">
        {proposalState}
      </CWText>
    </div>
  );
};
