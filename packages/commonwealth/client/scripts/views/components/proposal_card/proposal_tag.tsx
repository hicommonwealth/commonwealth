/* @jsx m */

import m from 'mithril';

import 'components/proposal_card/proposal_tag.scss';

import { CWText } from '../component_kit/cw_text';

export class ProposalTag implements m.ClassComponent<{ label: string }> {
  view(vnode) {
    const { label } = vnode.attrs;

    return (
      <CWText fontWeight="medium" className="ProposalTag">
        {label}
      </CWText>
    );
  }
}
