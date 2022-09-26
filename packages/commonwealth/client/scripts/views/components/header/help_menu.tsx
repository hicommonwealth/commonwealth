/* @jsx m */

import m from 'mithril';

import app from 'state';
import { pluralize } from 'helpers';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import { CWIconButton } from '../component_kit/cw_icon_button';
import {
  CWPopoverMenu,
  CWPopoverMenuItem,
} from '../component_kit/cw_popover/cw_popover_menu';

export class HelpMenu implements m.ClassComponent {
  view() {
    return (
      <CWPopoverMenu
        className="HelpMenu"
        hasArrow={false}
        transitionDuration={0}
        hoverCloseDelay={0}
        trigger={
          <CWIconButton
            disabled={!app.user.activeAccount}
            iconButtonTheme="black"
            iconName="help"
            iconSize="medium"
            inline={true}
          />
        }
        position="bottom-end"
        closeOnContentClick={true}
        closeOnOutsideClick={true}
        menuAttrs={{
          align: 'left',
        }}
        popoverMenuItems={
          <>
            <CWPopoverMenuItem
              label="Send Feedback"
              onclick={() => app.modals.create({ modal: ConfirmInviteModal })}
            />
            <CWPopoverMenuItem type="Divider" />
            <CWPopoverMenuItem
              label="Help"
              onclick={() => app.modals.create({ modal: ConfirmInviteModal })}
            />
          </>
        }
      />
    );
  }
}
