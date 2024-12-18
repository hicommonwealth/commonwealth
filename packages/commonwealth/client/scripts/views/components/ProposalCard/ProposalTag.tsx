import React from 'react';

import './ProposalTag.scss';

import { CWText } from '../component_kit/cw_text';

type ProposalTagProps = { label: string };

export const ProposalTag = ({ label }: ProposalTagProps) => {
  return (
    <CWText fontWeight="medium" className="ProposalTag">
      {label}
    </CWText>
  );
};
