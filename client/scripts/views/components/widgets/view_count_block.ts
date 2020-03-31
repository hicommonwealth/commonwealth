import 'components/view_count.scss';

import { default as m } from 'mithril';
import app from 'state';
import { default as $ } from 'jquery';
import { pluralize } from '../../../helpers';
import { OffchainThread } from 'client/scripts/models/models';

interface IAttrs {
  proposal: OffchainThread;
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
      object_id: vnode.attrs.proposal.id,
    }).then((response) => {
      if (response.status !== 'Success') {
        throw new Error('got unsuccessful status: ' + response.status);
      }
      vnode.state.count = response.result.view_count;
      m.redraw();
    });
  },
  view: (vnode) => {
    return vnode.state.count && m('.view-count-block',  pluralize(vnode.state.count, 'view'));
  }
};

export default ViewCountBlock;
