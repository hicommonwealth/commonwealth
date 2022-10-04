/* @jsx m */

import { pluralize } from 'helpers';
import m from 'mithril';

import app from 'state';
import { CWMenuItem } from '../components/component_kit/cw_menu_item';
import ConfirmInviteModal from '../modals/confirm_invite_modal';
import { LoginModal } from '../modals/login_modal';

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
        modal: LoginModal,
      });
    }
  }
};

export const getInvitesMenuItems = () => {
  return [
    {
      label: `Show ${pluralize(app.config.invites?.length, 'invite')}...`,
      onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
    },
  ];
};

export class InvitesMenu implements m.ClassComponent {
  view() {
    return (
      <div class="InvitesMenu">
        {getInvitesMenuItems().map((attrs) => (
          <CWMenuItem {...attrs} />
        ))}
      </div>
    );
  }
}
