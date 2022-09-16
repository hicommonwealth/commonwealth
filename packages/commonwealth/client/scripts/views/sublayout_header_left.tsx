/* @jsx m */

import m from 'mithril';

import 'sublayout_header_left.scss';

import app from '../state';
import { CommunityOptionsPopover } from './components/community_options_popover';
import { CWCommunityAvatar } from './components/component_kit/cw_community_avatar';
import { CWIconButton } from './components/component_kit/cw_icon_button';
import { CWDivider } from './components/component_kit/cw_divider';
import { isWindowMediumSmallInclusive } from './components/component_kit/helpers';

type SublayoutHeaderLeftAttrs = {
  isSidebarToggled: boolean;
  toggleSidebar: () => void;
};

export class SublayoutHeaderLeft
  implements m.ClassComponent<SublayoutHeaderLeftAttrs>
{
  view(vnode) {
    const { isSidebarToggled, toggleSidebar } = vnode.attrs;

    return (
      <div class="SublayoutHeaderLeft">
        <CWIconButton
          iconName="commonLogo"
          iconButtonTheme="black"
          iconSize="xl"
          onclick={() => {
            m.route.set('/');
          }}
        />
        {isWindowMediumSmallInclusive(window.innerWidth) && (
          <CWDivider isVertical />
        )}
        {!isSidebarToggled && app.activeChainId() && (
          <CWCommunityAvatar size="large" community={app.chain.meta} />
        )}
        {isWindowMediumSmallInclusive(window.innerWidth) && app.chain && (
          <CWIconButton
            iconButtonTheme="black"
            iconName={isSidebarToggled ? 'sidebarCollapse' : 'sidebarExpand'}
            onclick={() => {
              toggleSidebar();
              localStorage.setItem(
                'sidebar-toggle',
                (!isSidebarToggled).toString()
              );
              m.redraw();
            }}
          />
        )}
      </div>
    );
  }
}
