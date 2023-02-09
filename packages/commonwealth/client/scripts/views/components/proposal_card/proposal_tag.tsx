import React from 'react';

import type { ResultNode } from 'mithrilInterop';
import { ClassComponent } from 'mithrilInterop';

import 'components/proposal_card/proposal_tag.scss';

import { CWText } from '../component_kit/cw_text';

type ProposalTagAttrs = { label: string };

export class ProposalTag extends ClassComponent<ProposalTagAttrs> {
  view(vnode: ResultNode<ProposalTagAttrs>) {
    const { label } = vnode.attrs;

    return (
      <CWText fontWeight="medium" className="ProposalTag">
        {label}
      </CWText>
    );
  }
}
