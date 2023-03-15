import React from 'react';

import 'components/proposal_card/proposal_tag.scss';
import m from 'mithril';

import { CWText } from '../component_kit/cw_text';

type ProposalTagProps = { label: string };

export const ProposalTag = (props: ProposalTagProps) => {
  const { label } = props;

  return (
    <CWText fontWeight="medium" className="ProposalTag">
      {label}
    </CWText>
  );
};
