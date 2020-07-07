import 'components/header/index.scss';

import m from 'mithril';
import { Button, Icons } from 'construct-ui';

import app from 'state';

import NewProposalButton from 'views/components/new_proposal_button';
import ConfirmInviteModal from 'views/modals/confirm_invite_modal';
import NotificationsMenu from './notifications_menu';
import LoginSelector, { CurrentCommunityLabel } from './login_selector';

const Header: m.Component<{}> = {
  view: (vnode) => {
    return m('.Header', [
      m('.header-content', [
        m('.placeholder', [
          m(CurrentCommunityLabel),
        ]),
        // new proposal
        m(NewProposalButton, { fluid: false, dark: true }),
        // notifications menu
        app.isLoggedIn() && m(NotificationsMenu),
        // invites menu
        app.isLoggedIn() && app.config.invites?.length > 0 && m(Button, {
          class: 'cui-button-dark',
          size: 'sm',
          iconLeft: Icons.MAIL,
          onclick: () => app.modals.create({ modal: ConfirmInviteModal }),
        }),
        // login selector
        m(LoginSelector),
      ]),
    ]);
  }
};

export default Header;
