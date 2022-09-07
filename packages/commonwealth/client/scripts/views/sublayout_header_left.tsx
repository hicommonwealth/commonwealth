/* @jsx m */

import 'sublayout_header_left.scss';

import m from 'mithril';

import app from '../state';
import { CWIcon } from './components/component_kit/cw_icons/cw_icon';
import { CommunityOptionsPopover } from './components/community_options_popover';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWText } from './components/component_kit/cw_text';
import Sublayout from './sublayout';

type SublayoutHeaderLeftAttrs = {
  parentState: Sublayout;
};

export class SublayoutHeaderLeft
  implements m.ClassComponent<SublayoutHeaderLeftAttrs>
{
  view(vnode) {
    const { parentState } = vnode.attrs;
    const { sidebarToggled } = parentState;
    const showChainInfo = app.activeChainId() && !sidebarToggled;

    return (
      <div class="SublayoutHeaderLeft">
        <CWIcon className="commonLogo" iconName="commonLogo" iconSize="xl" />
        <CommunityOptionsPopover />
        {showChainInfo && (
          <>
            <CWCommunityAvatar size="large" community={app.chain.meta} />
          </>
        )}
        {app.chain && (
          <CWIcon
            className={sidebarToggled ? 'sidebarCollapse' : 'sidebarExpand'}
            iconName={sidebarToggled ? 'sidebarCollapse' : 'sidebarExpand'}
            onclick={() => {
              parentState.sidebarToggled = !sidebarToggled;
              localStorage.setItem(
                'sidebar-toggle',
                (!sidebarToggled).toString()
              );
              m.redraw();
            }}
          />
        )}
      </div>
    );
  }
}
