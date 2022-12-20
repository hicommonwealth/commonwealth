/* @jsx m */

import m from 'mithril';
import { ClassComponent } from 'mithrilInterop';
import { PopoverMenu, Button, Icons, MenuItem } from 'construct-ui';
import { pluralize } from 'helpers';

import 'components/header/invites_menu.scss';

import app from 'state';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import ConfirmInviteModal from '../modals/confirm_invite_modal';
import { NewLoginModal } from '../modals/login_modal';

export const handleEmailInvites = (state) => {
  if (!state.modalAutoTriggered && app.user) {
    state.modalAutoTriggered = true;

    if (app.config.invites?.length) {
      app.modals.create({
        modal: ConfirmInviteModal,
        data: { community: m.route.param('inviteComm') },
      });
    } else if (!app.user.activeAccount) {
      app.modals.create({
        modal: NewLoginModal,
      });
    }
  }
};

export class InvitesMenu extends ClassComponent {
  view() {
    return (
      <CWMobileMenu
        className="InvitesMenu"
        menuHeader={{
          label: 'Invites',
          onclick: () => {
            app.mobileMenu = 'MainMenu';
          },
        }}
        menuItems={[
          {
            label: `Show ${pluralize(app.config.invites?.length, 'invite')}...`,
            onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
          },
        ]}
      />
    );
  }
}

export class InvitesMenuPopover extends ClassComponent {
  view() {
    return m(PopoverMenu, {
      hasArrow: false,
      transitionDuration: 0,
      hoverCloseDelay: 0,
      trigger: (
        <div class="invites-button-wrap">
          {m(Button, {
            iconLeft: Icons.MAIL,
            intent: 'primary',
            size: 'default',
            compact: true,
          })}
          <div
            class="invites-count-container"
            style={
              app.config.invites.length === 1
                ? 'padding: 2px 3px'
                : 'padding: 2px'
            }
          >
            <div class="invites-count">{app.config.invites.length}</div>
          </div>
        </div>
      ),
      position: 'bottom-end',
      closeOnContentClick: true,
      closeOnOutsideClick: true,
      menuAttrs: {
        align: 'left',
      },
      content: m(MenuItem, {
        onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
        label: `Show ${pluralize(app.config.invites?.length, 'invite')}...`,
      }),
    });
  }
}
