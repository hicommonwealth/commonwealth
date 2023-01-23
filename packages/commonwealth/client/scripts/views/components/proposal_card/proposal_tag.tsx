/* @jsx m */

import ClassComponent from 'class_component';

import 'components/proposal_card/proposal_tag.scss';
import m from 'mithril';

import { CWText } from '../component_kit/cw_text';

type ProposalTagAttrs = { label: string };

export class ProposalTag extends ClassComponent<ProposalTagAttrs> {
  view(vnode: m.Vnode<ProposalTagAttrs>) {
    const { label } = vnode.attrs;

    return (
      <CWText fontWeight="medium" className="ProposalTag">
        {label}
      </CWText>
    );
  }
}
