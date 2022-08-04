/* @jsx m */

import m from 'mithril';
import moment from 'moment';

import 'components/proposal_pills.scss';

import { formatTimestamp } from 'helpers';
import { CWText } from './component_kit/cw_text';

export class ActiveProposalPill
  implements m.ClassComponent<{ proposalEnd: number }>
{
  view(vnode) {
    const { proposalEnd } = vnode.attrs;

    return (
      <div class="ActiveProposalPill">
        <CWText type="caption">
          Ends in {formatTimestamp(moment(+proposalEnd * 1000))}
        </CWText>
        <CWText type="caption" fontWeight="medium" className="active-text">
          Active
        </CWText>
      </div>
    );
  }
}

export class ClosedProposalPill
  implements m.ClassComponent<{ proposalState: string }>
{
  view(vnode) {
    const { proposalState } = vnode.attrs;

    return (
      <div class="ClosedProposalPill">
        <CWText type="caption" fontWeight="semiBold" className="closed-text">
          {proposalState}
        </CWText>
      </div>
    );
  }
}
