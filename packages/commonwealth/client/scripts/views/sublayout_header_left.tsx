/* @jsx m */

import 'sublayout_header_left.scss';

import m from 'mithril';

import { CWIcon } from './components/component_kit/cw_icons/cw_icon';
import { CommunityOptionsPopover } from './components/community_options_popover';

type SublayoutHeaderLeftAttrs = {
  sidebarToggleFn: () => null;
};

export class SublayoutHeaderLeft
  implements m.ClassComponent<SublayoutHeaderLeftAttrs>
{
  private sidebarIsToggled: boolean;

  view(vnode) {
    const { sidebarToggleFn } = vnode.attrs;
    const { sidebarIsToggled } = this;

    return (
      <div class="SublayoutHeaderLeft">
        <CWIcon
          iconName={sidebarIsToggled ? 'sidebarCollapse' : 'sidebarExpand'}
          onclick={sidebarToggleFn}
        />
        <CommunityOptionsPopover />
      </div>
    );
  }
}
