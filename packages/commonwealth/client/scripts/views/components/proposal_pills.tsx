/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import moment from 'moment';

import 'components/proposal_pills.scss';

import { formatTimestamp } from 'helpers';
import { CWText } from './component_kit/cw_text';

type ActiveProposalPillAttrs = { proposalEnd: number };

export class ActiveProposalPill extends ClassComponent<ActiveProposalPillAttrs> {
  view(vnode: m.Vnode<ActiveProposalPillAttrs>) {
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

type ClosedProposalPillAttrs = { proposalState: string };

export class ClosedProposalPill extends ClassComponent<ClosedProposalPillAttrs> {
  view(vnode: m.Vnode<ClosedProposalPillAttrs>) {
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
