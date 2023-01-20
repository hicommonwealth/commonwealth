/* @jsx m */

import ClassComponent from 'class_component';
import { pluralize } from 'helpers';
import m from 'mithril';

import app from 'state';
import { CWIconButton } from '../components/component_kit/cw_icon_button';
import { CWCustomIcon } from '../components/component_kit/cw_icons/cw_custom_icon';
import { CWMobileMenu } from '../components/component_kit/cw_mobile_menu';
import { ConfirmInviteModal } from '../modals/confirm_invite_modal';
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
    return app.config.invites?.length > 0 ? (
      <div
        class="unreads-icon"
        onclick={() => app.modals.create({ modal: ConfirmInviteModal })}
      >
        <CWCustomIcon iconName="invites" />
      </div>
    ) : (
      <CWIconButton
        iconName="mail"
        onclick={() => app.modals.create({ modal: ConfirmInviteModal })}
      />
    );
  }
}
