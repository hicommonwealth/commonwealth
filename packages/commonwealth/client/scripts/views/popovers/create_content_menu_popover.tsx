/* @jsx m */

import 'components/create_content_popover.scss';
import m from 'mithril';
import app from 'state';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { getCreateContentMenuItemAttrs } from '../menus/create_content_menu';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';

type CreateContentPopoverAttrs = {
  fluid: boolean;
};

export class CreateContentPopover
  implements m.Component<CreateContentPopoverAttrs>
{
  view() {
    if (!app.isLoggedIn() || !app.chain || !app.activeChainId()) return;

    return (
      <CWPopoverMenu
        transitionDuration={0}
        hoverCloseDelay={0}
        hasArrow={false}
        trigger={
          <CWIcon disabled={!app.user.activeAccount} iconName="plusCircle" />
        }
        position="bottom-start"
        closeOnContentClick={true}
        menuAttrs={{
          align: 'left',
        }}
        menuItems={getCreateContentMenuItemAttrs()}
      />
    );
  }
}
