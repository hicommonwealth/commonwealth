import { default as m } from 'mithril';
import app from 'state';
import { default as $ } from 'jquery';
import { OffchainThread, AnyProposal } from 'models';
import { pluralize } from '../../../helpers';

interface IAttrs {
  proposal: OffchainThread | AnyProposal;
}

interface IState {
  count: number;
}

// show a view count that that auto-increments every time it is requested
const ViewCountBlock: m.Component<IAttrs, IState> = {
  oncreate: (vnode) => {
    $.post(`${app.serverUrl()}/viewCount`, {
      chain: app.activeChainId(),
      community: app.activeCommunityId(),
      object_id: (vnode.attrs.proposal instanceof OffchainThread) ? vnode.attrs.proposal.id : vnode.attrs.proposal.slug,
    }).then((response) => {
      if (response.status !== 'Success') {
        throw new Error('got unsuccessful status: ' + response.status);
      }
      vnode.state.count = response.result.view_count;
      m.redraw();
    });
  },
  view: (vnode) => {
    return m('.ViewCountBlock', pluralize(vnode.state.count ? vnode.state.count : 0, 'view'));
  }
};

export default ViewCountBlock;
