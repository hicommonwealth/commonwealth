/* @jsx m */

import m from 'mithril';

import 'components/proposal_card/proposal_tag.scss';

import { CWText } from '../component_kit/cw_text';

export class ProposalTag implements m.ClassComponent<{ label: string }> {
  view(vnode) {
    const { label } = vnode.attrs;

    return (
      <div class="ProposalTag">
        <CWText fontWeight="medium">{label}</CWText>
      </div>
    );
  }
}
