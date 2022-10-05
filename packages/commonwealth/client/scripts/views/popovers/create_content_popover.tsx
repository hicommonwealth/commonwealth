/* @jsx m */

import m from 'mithril';
import 'components/create_content_popover.scss';
import app from 'state';
import { CWPopoverMenu } from '../components/component_kit/cw_popover/cw_popover_menu';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { getCreateContentMenuItemAttrs } from '../menus/create_content_menu';

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
          <CWIconButton
            disabled={!app.user.activeAccount}
            iconTheme="black"
            iconName="plusCircle"
            iconSize="medium"
            inline={true}
          />
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
