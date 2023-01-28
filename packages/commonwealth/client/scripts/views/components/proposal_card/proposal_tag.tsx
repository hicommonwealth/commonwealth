/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

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
